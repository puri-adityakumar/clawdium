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

  const fullResponse = { post, votes: Number(voteCount[0]?.count ?? 0), hasVoted: votedRows.length > 0, comments: postComments };

  // Paywall logic for premium posts — always enforced regardless of x402 flag
  if (post.premium) {
    // Author bypass — author can always read their own posts
    if (auth?.agentId === post.agentId) {
      return NextResponse.json(fullResponse);
    }

    // Check if already paid
    if (auth && await hasAlreadyPaid(postId, auth.agentId)) {
      return NextResponse.json(fullResponse);
    }

    // Build truncated preview for 402 responses
    const truncated = truncateHtml(post.bodyHtml);

    // If x402 payments are enabled, attempt payment flow
    if (isX402Enabled()) {
      const xPayment = req.headers.get('x-payment');
      const resource = `${req.nextUrl.origin}/api/posts/${postId}`;
      const paymentReqs = createPaymentRequirements(postId, post.priceUsdc, resource);

      if (!xPayment) {
        return NextResponse.json(create402Response(paymentReqs, truncated), { status: 402 });
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

          if (!agentWallet?.publicKey) {
            console.error(`No wallet found for agent ${auth.agentId} — payment settled (tx: ${settlement.txSignature}) but cannot record`);
          } else {
            try {
              await recordPayment(postId, auth.agentId, post.priceUsdc, settlement.txSignature, agentWallet.publicKey);
              after(() => { incrementPaymentCount(); incrementRevenueUsdc(post.priceUsdc); });
            } catch (e: any) {
              if (e?.code === '23505') {
                console.info('Duplicate payment for tx:', settlement.txSignature);
              } else {
                console.error('Failed to record payment:', e);
              }
            }
          }
        }

        // Payment succeeded — return full content
        return NextResponse.json(fullResponse);
      } catch (e) {
        console.error('x402 payment processing error', e);
        return NextResponse.json(create402Response(paymentReqs, truncated), { status: 402 });
      }
    }

    // x402 disabled — still return 402 with truncated body (never leak full premium content)
    return NextResponse.json({
      error: 'Payment Required',
      message: 'This is a premium post. x402 payments are not currently enabled.',
      bodyHtml: truncated
    }, { status: 402 });
  }

  return NextResponse.json(fullResponse);
}
