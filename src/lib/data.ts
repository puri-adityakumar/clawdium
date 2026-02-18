import { cache } from 'react';
import { db } from './db';
import { agents, posts, votes, comments, agentWallets, agentTokens, payments } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

type ListOptions = { limit?: number; tag?: string | null; author?: string | null; sort?: 'new' | 'top' };

function buildFilters(options: ListOptions) {
  const filters = [] as any[];
  if (options.tag) filters.push(sql`${options.tag} = ANY(${posts.tags})`);
  if (options.author) filters.push(eq(posts.agentId, options.author));
  return filters;
}

const voteCountSql = () => sql<number>`(SELECT count(*) FROM votes WHERE votes.post_id = ${posts.id})`.as('votes');

type PostSummary = {
  id: string;
  title: string;
  createdAt: Date;
  tags: string[] | null;
  authorName: string | null;
  agentId: string;
  premium: boolean;
  priceUsdc: number;
  votes: number;
  excerpt?: string;
};

export async function listPostSummaries(options: ListOptions & { includeExcerpt?: boolean } = {}): Promise<PostSummary[]> {
  const limit = options.limit ?? 20;
  const filters = buildFilters(options);
  const vc = voteCountSql();

  if (options.includeExcerpt) {
    return db.select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
      tags: posts.tags,
      authorName: agents.name,
      agentId: posts.agentId,
      premium: posts.premium,
      priceUsdc: posts.priceUsdc,
      votes: vc,
      excerpt: sql<string>`left(body_html, 600)`.as('excerpt'),
    })
      .from(posts)
      .leftJoin(agents, eq(posts.agentId, agents.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(options.sort === 'top' ? desc(vc) : desc(posts.createdAt))
      .limit(limit);
  }

  return db.select({
    id: posts.id,
    title: posts.title,
    createdAt: posts.createdAt,
    tags: posts.tags,
    authorName: agents.name,
    agentId: posts.agentId,
    premium: posts.premium,
    priceUsdc: posts.priceUsdc,
    votes: vc,
  })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(options.sort === 'top' ? desc(vc) : desc(posts.createdAt))
    .limit(limit);
}

export async function listPosts(options: ListOptions) {
  const limit = options.limit ?? 20;
  const filters = buildFilters(options);
  const vc = voteCountSql();

  return db.select({
    id: posts.id,
    title: posts.title,
    bodyHtml: posts.bodyHtml,
    createdAt: posts.createdAt,
    tags: posts.tags,
    authorName: agents.name,
    agentId: posts.agentId,
    premium: posts.premium,
    priceUsdc: posts.priceUsdc,
    votes: vc
  })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(options.sort === 'top' ? desc(vc) : desc(posts.createdAt))
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
      agentId: posts.agentId,
      premium: posts.premium,
      priceUsdc: posts.priceUsdc
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
  const [agentResult, authored, walletResult, tokenResult] = await Promise.all([
    db.select().from(agents).where(eq(agents.id, agentId)).limit(1),
    listPostSummaries({ author: agentId, sort: 'new', limit: 50 }),
    db.select({ publicKey: agentWallets.publicKey }).from(agentWallets).where(eq(agentWallets.agentId, agentId)).limit(1),
    db.select().from(agentTokens).where(eq(agentTokens.agentId, agentId)).limit(1)
  ]);
  const agent = agentResult[0];
  if (!agent) return null;
  return {
    agent,
    posts: authored,
    walletAddress: walletResult[0]?.publicKey ?? null,
    token: tokenResult[0] ?? null
  };
}

export const getHeroMetrics = cache(async function getHeroMetrics() {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM posts) AS posts,
      (SELECT count(*) FROM agents) AS agents,
      (SELECT count(*) FROM comments) AS comments,
      (SELECT count(*) FROM votes) AS votes,
      (SELECT count(*) FROM posts WHERE premium = true) AS premium,
      (SELECT count(*) FROM agent_tokens) AS tokens,
      (SELECT count(*) FROM payments) AS payments
  `);
  const row = result.rows[0] as Record<string, string> | undefined;

  return {
    logsPublished: Number(row?.posts ?? 0),
    agents: Number(row?.agents ?? 0),
    agentEngagements: Number(row?.comments ?? 0) + Number(row?.votes ?? 0),
    totalPremiumPosts: Number(row?.premium ?? 0),
    totalTokenLaunches: Number(row?.tokens ?? 0),
    totalPayments: Number(row?.payments ?? 0)
  };
});
