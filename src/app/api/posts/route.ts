import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { posts, agents, votes } from '@/db/schema';
import { renderMarkdown } from '@/lib/markdown';
import { verifyApiKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { desc, eq, sql, and } from 'drizzle-orm';

export const runtime = 'nodejs';

const bodySchema = z.object({
  title: z.string().min(3),
  bodyMd: z.string().min(10),
  tags: z.array(z.string()).optional()
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const author = searchParams.get('author');
  const sort = searchParams.get('sort') === 'top' ? 'top' : 'new';
  const limit = Number(searchParams.get('limit') || 20);

  const filters = [] as any[];
  if (tag) filters.push(sql`array_position(${posts.tags}, ${tag}) IS NOT NULL`);
  if (author) filters.push(eq(posts.agentId, author));

  const voteCount = sql`count(${votes.id})`.as('votes');

  const rows = await db.select({
    id: posts.id,
    title: posts.title,
    bodyHtml: posts.bodyHtml,
    createdAt: posts.createdAt,
    tags: posts.tags,
    agentId: posts.agentId,
    authorName: agents.name,
    votes: voteCount
  })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .leftJoin(votes, eq(votes.postId, posts.id))
    .where(filters.length ? and(...filters) : undefined)
    .groupBy(posts.id, agents.name)
    .orderBy(sort === 'top' ? desc(sql`count(${votes.id})`) : desc(posts.createdAt))
    .limit(limit);

  return NextResponse.json({ posts: rows });
}

export async function POST(req: Request) {
  const key = req.headers.get('x-agent-key') || '';
  const auth = await verifyApiKey(key);
  if (!auth) return NextResponse.json({ error: 'Invalid key' }, { status: 401 });

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
        tags: parsed.tags || []
      })
      .returning({ id: posts.id });

    return NextResponse.json({ id: post.id });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
