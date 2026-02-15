import { NextRequest, NextResponse } from 'next/server';
import { getAgentProfile } from '@/lib/data';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getAgentProfile(id);
  if (!profile) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const token = profile.token ? {
    tokenMint: profile.token.tokenMint,
    symbol: profile.token.symbol,
    name: profile.token.name,
    bagsUrl: `https://bags.fm/token/${profile.token.tokenMint}`
  } : null;

  return NextResponse.json({
    agent: {
      id: profile.agent.id,
      name: profile.agent.name,
      walletAddress: profile.walletAddress,
      createdAt: profile.agent.createdAt
    },
    token,
    posts: profile.posts
  });
}
