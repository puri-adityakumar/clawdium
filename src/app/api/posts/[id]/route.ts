import { NextRequest, NextResponse, after } from 'next/server';
import { db } from '@/lib/db';
import { posts, agents, comments, votes } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { verifyApiKey } from '@/lib/auth';
import {
  isX402Enabled,
  createPaymentRequirements,
  verifyPayment,
  settlePayment,
  hasAlreadyPaid,
  recordPayment,
  truncateHtml,
  create402Response
} from '@/lib/x402';
import { getAgentWallet } from '@/lib/solana';
import { checkRateLimit } from '@/lib/rate-limit';
import { incrementPaymentCount, incrementRevenueUsdc, incrementAgentApiCalls } from '@/lib/metrics';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const key = req.headers.get('x-agent-key') || '';
  const auth = key ? await verifyApiKey(key) : null;

  if (auth) after(() => incrementAgentApiCalls());

  const [post] = await db.select({
    id: posts.id,
    title: posts.title,
    bodyHtml: posts.bodyHtml,
    bodyMd: posts.bodyMd,
    tags: posts.tags,
    createdAt: posts.createdAt,
    agentId: posts.agentId,
    authorName: agents.name,
    premium: posts.premium,
    priceUsdc: posts.priceUsdc
  })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [voteCount, votedRows, postComments] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(votes).where(eq(votes.postId, postId)),
    auth
      ? db.select().from(votes).where(and(eq(votes.postId, postId), eq(votes.agentId, auth.agentId))).limit(1)
      : Promise.resolve([]),
    db
      .select({
        id: comments.id,
        bodyHtml: comments.bodyHtml,
        createdAt: comments.createdAt,
        agentId: comments.agentId,
        authorName: agents.name
      })
      .from(comments)
      .leftJoin(agents, eq(comments.agentId, agents.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
  ]);

  // Paywall logic for premium posts
  if (post.premium && isX402Enabled()) {
    // Author bypass — author can always read their own posts
    if (auth?.agentId === post.agentId) {
      return NextResponse.json({ post, votes: Number(voteCount[0]?.count ?? 0), hasVoted: votedRows.length > 0, comments: postComments });
    }

    // Check if already paid
    if (auth && await hasAlreadyPaid(postId, auth.agentId)) {
      return NextResponse.json({ post, votes: Number(voteCount[0]?.count ?? 0), hasVoted: votedRows.length > 0, comments: postComments });
    }

    // Check X-Payment header
    const xPayment = req.headers.get('x-payment');
    const resource = `${req.nextUrl.origin}/api/posts/${postId}`;
    const paymentReqs = createPaymentRequirements(postId, post.priceUsdc, resource);

    if (!xPayment) {
      // No payment — return 402 with truncated body
      const truncated = truncateHtml(post.bodyHtml);
      return NextResponse.json(
        create402Response(paymentReqs, truncated),
        { status: 402 }
      );
    }

    // Rate limit payment verification to prevent facilitator abuse
    if (auth) {
      const paymentRate = await checkRateLimit(`payment-verify:${auth.agentId}`);
      if (!paymentRate.success) {
        return NextResponse.json({ error: 'Too many payment attempts' }, { status: 429 });
      }
    }

    // Verify and settle payment
    try {
      const verification = await verifyPayment(xPayment, paymentReqs);
      if (!verification.valid) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 402 });
      }

      const settlement = await settlePayment(xPayment, paymentReqs);
      if (!settlement.success) {
        return NextResponse.json({ error: 'Payment settlement failed' }, { status: 402 });
      }

      if (!settlement.txSignature) {
        return NextResponse.json({ error: 'Payment settlement incomplete — no transaction signature' }, { status: 502 });
      }

      // Record payment and track metrics
      if (auth) {
        const agentWallet = await getAgentWallet(auth.agentId);
        const payerWalletAddr = agentWallet?.publicKey ?? 'unknown';

        try {
          await recordPayment(postId, auth.agentId, post.priceUsdc, settlement.txSignature, payerWalletAddr);
          after(() => { incrementPaymentCount(); incrementRevenueUsdc(post.priceUsdc); });
        } catch (e: any) {
          // Only swallow duplicate constraint errors
          if (e?.code === '23505') {
            console.info('Duplicate payment for tx:', settlement.txSignature);
          } else {
            console.error('Failed to record payment:', e);
          }
        }
      }
    } catch (e) {
      console.error('x402 payment processing error', e);
      const truncated = truncateHtml(post.bodyHtml);
      return NextResponse.json(
        create402Response(paymentReqs, truncated),
        { status: 402 }
      );
    }
  }

  return NextResponse.json({ post, votes: Number(voteCount[0]?.count ?? 0), hasVoted: votedRows.length > 0, comments: postComments });
}
