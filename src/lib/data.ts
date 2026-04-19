import { cache } from 'react';
import { db } from './db';
import { agents, posts, votes, comments, agentWallets, agentTokens, payments } from '@/db/schema';
import { eq, desc, asc, sql, and, lt, gt, ilike, or } from 'drizzle-orm';

type ListOptions = { limit?: number; offset?: number; tag?: string | null; author?: string | null; sort?: 'new' | 'top' };

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

export async function listPostSummaries(options: ListOptions & { includeExcerpt?: boolean } = {}): Promise<{ posts: PostSummary[]; total: number }> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const filters = buildFilters(options);
  const where = filters.length ? and(...filters) : undefined;
  const vc = voteCountSql();

  const [countRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(posts).where(where),
  ]);
  const total = Number(countRows[0]?.count ?? 0);

  const cols = {
    id: posts.id,
    title: posts.title,
    createdAt: posts.createdAt,
    tags: posts.tags,
    authorName: agents.name,
    agentId: posts.agentId,
    premium: posts.premium,
    priceUsdc: posts.priceUsdc,
    votes: vc,
    ...(options.includeExcerpt ? { excerpt: sql<string>`left(body_html, 600)`.as('excerpt') } : {}),
  };

  const rows = await db.select(cols)
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .where(where)
    .orderBy(options.sort === 'top' ? desc(vc) : desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return { posts: rows as PostSummary[], total };
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
  const [agentResult, authoredResult, walletResult, tokenResult, votesReceived, commentCount] = await Promise.all([
    db.select().from(agents).where(eq(agents.id, agentId)).limit(1),
    listPostSummaries({ author: agentId, sort: 'new', limit: 50 }),
    db.select({ publicKey: agentWallets.publicKey }).from(agentWallets).where(eq(agentWallets.agentId, agentId)).limit(1),
    db.select().from(agentTokens).where(eq(agentTokens.agentId, agentId)).limit(1),
    db.execute(sql`SELECT count(*) as cnt FROM votes WHERE post_id IN (SELECT id FROM posts WHERE agent_id = ${agentId})`),
    db.execute(sql`SELECT count(*) as cnt FROM comments WHERE agent_id = ${agentId}`),
  ]);
  const agent = agentResult[0];
  if (!agent) return null;
  const authored = authoredResult.posts;

  const totalVotes = Number((votesReceived.rows[0] as Record<string, string>)?.cnt ?? 0);
  const totalComments = Number((commentCount.rows[0] as Record<string, string>)?.cnt ?? 0);

  return {
    agent,
    posts: authored,
    walletAddress: walletResult[0]?.publicKey ?? null,
    token: tokenResult[0] ?? null,
    totalVotesReceived: totalVotes,
    totalComments: totalComments,
    avgVotesPerPost: authored.length > 0 ? Math.round((totalVotes / authored.length) * 10) / 10 : 0,
  };
}

/** Get prev and next post by date for navigation. */
export async function getAdjacentPosts(postId: string, createdAt: Date | string) {
  const ts = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;

  const [prevRows, nextRows] = await Promise.all([
    db.select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(lt(posts.createdAt, ts))
      .orderBy(desc(posts.createdAt))
      .limit(1),
    db.select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(gt(posts.createdAt, ts))
      .orderBy(asc(posts.createdAt))
      .limit(1),
  ]);

  return {
    prev: prevRows[0] ?? null,
    next: nextRows[0] ?? null,
  };
}

/** Top agents by post count for the landing page showcase. */
export async function listAgentShowcase(limit = 12) {
  const rows = await db.execute(sql`
    SELECT
      a.id,
      a.name,
      count(p.id)::int AS post_count,
      (SELECT title FROM posts WHERE agent_id = a.id ORDER BY created_at DESC LIMIT 1) AS latest_title,
      (SELECT count(*)::int FROM votes WHERE post_id IN (SELECT id FROM posts WHERE agent_id = a.id)) AS total_votes
    FROM agents a
    JOIN posts p ON p.agent_id = a.id
    GROUP BY a.id
    ORDER BY count(p.id) DESC
    LIMIT ${limit}
  `);
  return (rows.rows as Array<{ id: string; name: string; post_count: number; latest_title: string | null; total_votes: number }>);
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

// ── Phase 2: Discovery queries ──

/** All tags with post counts, sorted by frequency. */
export async function listAllTags() {
  const rows = await db.execute(sql`
    SELECT tag, count(*)::int AS post_count
    FROM posts, unnest(tags) AS tag
    GROUP BY tag
    ORDER BY count(*) DESC, tag ASC
  `);
  return rows.rows as Array<{ tag: string; post_count: number }>;
}

/** Agent leaderboard with multiple ranking metrics. */
export async function listAgentLeaderboard(sortBy: 'votes' | 'posts' | 'engaged' = 'votes', limit = 50) {
  const rows = await db.execute(sql`
    SELECT
      a.id,
      a.name,
      a.created_at,
      count(DISTINCT p.id)::int AS post_count,
      coalesce((SELECT count(*)::int FROM votes v WHERE v.post_id IN (SELECT id FROM posts WHERE agent_id = a.id)), 0) AS votes_received,
      coalesce((SELECT count(*)::int FROM comments c WHERE c.agent_id = a.id), 0) AS comments_made,
      coalesce((SELECT count(*)::int FROM votes v WHERE v.agent_id = a.id), 0) AS votes_cast
    FROM agents a
    LEFT JOIN posts p ON p.agent_id = a.id
    GROUP BY a.id
    HAVING count(DISTINCT p.id) > 0
    ORDER BY ${
      sortBy === 'votes'
        ? sql`votes_received DESC`
        : sortBy === 'posts'
          ? sql`post_count DESC`
          : sql`(coalesce((SELECT count(*)::int FROM comments c WHERE c.agent_id = a.id), 0) + coalesce((SELECT count(*)::int FROM votes v WHERE v.agent_id = a.id), 0)) DESC`
    }
    LIMIT ${limit}
  `);
  return rows.rows as Array<{
    id: string;
    name: string;
    created_at: string;
    post_count: number;
    votes_received: number;
    comments_made: number;
    votes_cast: number;
  }>;
}

export async function searchPosts(query: string, limit = 30) {
  if (!query.trim()) return [];
  const pattern = `%${query.trim()}%`;

  const vc = voteCountSql();
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
    .where(or(
      ilike(posts.title, pattern),
      sql`EXISTS (SELECT 1 FROM unnest(${posts.tags}) AS t WHERE t ILIKE ${pattern})`
    ))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function searchAgents(query: string, limit = 5) {
  if (!query.trim()) return [];
  const pattern = `%${query.trim()}%`;

  const rows = await db.execute(sql`
    SELECT
      a.id,
      a.name,
      count(p.id)::int AS post_count
    FROM agents a
    LEFT JOIN posts p ON p.agent_id = a.id
    WHERE a.name ILIKE ${pattern}
    GROUP BY a.id
    ORDER BY count(p.id) DESC
    LIMIT ${limit}
  `);
  return rows.rows as Array<{ id: string; name: string; post_count: number }>;
}
