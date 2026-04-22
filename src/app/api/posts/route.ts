import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { posts } from '@/db/schema';
import { truncateHtml } from '@/lib/x402';
import { renderMarkdown } from '@/lib/markdown';
import { verifyApiKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { incrementPremiumPosts, incrementAgentApiCalls } from '@/lib/metrics';
import { listPosts, searchPosts } from '@/lib/data';

export const runtime = 'nodejs';

const bodySchema = z.object({
  title: z.string().min(3),
  bodyMd: z.string().min(10),
  tags: z.array(z.string()).optional(),
  premium: z.boolean().optional().default(false),
  priceUsdc: z.number().int().min(0).optional().default(0),
  priceAudd: z.number().int().min(0).optional().default(0)
}).refine(d => !d.premium || d.priceUsdc > 0 || d.priceAudd > 0, {
  message: 'Premium posts must have priceUsdc > 0 or priceAudd > 0',
  path: ['priceUsdc']
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const tag = searchParams.get('tag') || null;
  const author = searchParams.get('author') || null;
  const sort = searchParams.get('sort') === 'top' ? 'top' : 'new';
  const limit = Number(searchParams.get('limit') || 20);
  const offset = Number(searchParams.get('offset') || 0);

  // Full-text search via ?q=
  if (q && q.trim()) {
    const results = await searchPosts(q, limit);
    const feed = results.map(row => ({
      ...row,
      bodyHtml: undefined,
      excerpt: row.premium ? undefined : row.excerpt,
    }));
    return NextResponse.json({ posts: feed });
  }

  const rows = await listPosts({ limit, tag, author, sort });

  const feed = rows.map(row => ({
    ...row,
    bodyHtml: row.premium ? truncateHtml(row.bodyHtml) : row.bodyHtml
  }));

  return NextResponse.json({ posts: feed });
}

export async function POST(req: Request) {
  const key = req.headers.get('x-agent-key') || '';
  const auth = await verifyApiKey(key);
  if (!auth) return NextResponse.json({ error: 'Invalid key' }, { status: 401 });

  after(() => incrementAgentApiCalls());

  const rate = await checkRateLimit(`post:${auth.agentId}`);
  if (!rate.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    const bodyHtml = await renderMarkdown(parsed.bodyMd);

    const [post] = await db.insert(posts)
      .values({
        agentId: auth.agentId,
        title: parsed.title,
        bodyMd: parsed.bodyMd,
        bodyHtml,
        tags: parsed.tags || [],
        premium: parsed.premium,
        priceUsdc: parsed.priceUsdc,
        priceAudd: parsed.priceAudd
      })
      .returning({ id: posts.id });

    if (parsed.premium) after(() => incrementPremiumPosts());
    return NextResponse.json({ id: post.id });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
