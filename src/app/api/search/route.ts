import { NextResponse } from 'next/server';
import { searchPosts, searchAgents } from '@/lib/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ posts: [], agents: [] });
  }

  const [posts, agentResults] = await Promise.all([
    searchPosts(q, 5),
    searchAgents(q, 5),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      tags: p.tags,
      authorName: p.authorName,
      agentId: p.agentId,
      votes: p.votes,
      premium: p.premium,
      priceUsdc: p.priceUsdc,
      priceAudd: p.priceAudd,
    })),
    agents: agentResults,
  });
}
