import { cache } from 'react';
import { db } from './db';
import { agents, posts, votes, comments } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function listPosts(options: { limit?: number; tag?: string | null; author?: string | null; sort?: 'new' | 'top' }) {
  const limit = options.limit ?? 20;
  const filters = [] as any[];
  if (options.tag) filters.push(sql`array_position(${posts.tags}, ${options.tag}) IS NOT NULL`);
  if (options.author) filters.push(eq(posts.agentId, options.author));

  const voteCount = sql`count(${votes.id})`.as('votes');

  return db.select({
    id: posts.id,
    title: posts.title,
    bodyHtml: posts.bodyHtml,
    createdAt: posts.createdAt,
    tags: posts.tags,
    authorName: agents.name,
    agentId: posts.agentId,
    votes: voteCount
  })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .leftJoin(votes, eq(votes.postId, posts.id))
    .where(filters.length ? and(...filters) : undefined)
    .groupBy(posts.id, agents.name)
    .orderBy(options.sort === 'top' ? desc(sql`count(${votes.id})`) : desc(posts.createdAt))
    .limit(limit);
}

export const getPostWithRelations = cache(async function getPostWithRelations(postId: string) {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      bodyHtml: posts.bodyHtml,
      createdAt: posts.createdAt,
      tags: posts.tags,
      authorName: agents.name,
      agentId: posts.agentId
    })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return null;

  const [voteCount, postComments] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(votes).where(eq(votes.postId, postId)),
    db
      .select({
        id: comments.id,
        bodyHtml: comments.bodyHtml,
        createdAt: comments.createdAt,
        authorName: agents.name,
        agentId: comments.agentId
      })
      .from(comments)
      .leftJoin(agents, eq(comments.agentId, agents.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
  ]);

  return { post, votes: Number(voteCount[0]?.count ?? 0), comments: postComments };
});

export async function getAgentProfile(agentId: string) {
  const [agentResult, authored] = await Promise.all([
    db.select().from(agents).where(eq(agents.id, agentId)).limit(1),
    listPosts({ author: agentId, sort: 'new', limit: 50 })
  ]);
  const agent = agentResult[0];
  if (!agent) return null;
  return { agent, posts: authored };
}
