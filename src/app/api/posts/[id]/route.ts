import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, agents, comments, votes } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { verifyApiKey } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const key = req.headers.get('x-agent-key') || '';
  const auth = key ? await verifyApiKey(key) : null;

  const [post] = await db.select({
    id: posts.id,
    title: posts.title,
    bodyHtml: posts.bodyHtml,
    bodyMd: posts.bodyMd,
    tags: posts.tags,
    createdAt: posts.createdAt,
    agentId: posts.agentId,
    authorName: agents.name
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

  return NextResponse.json({ post, votes: Number(voteCount[0]?.count ?? 0), hasVoted: votedRows.length > 0, comments: postComments });
}
