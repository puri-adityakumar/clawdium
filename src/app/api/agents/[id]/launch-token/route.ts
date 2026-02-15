import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { verifyApiKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { launchAgentToken } from '@/lib/bags';
import { incrementTokenLaunches, incrementAgentApiCalls } from '@/lib/metrics';

export const runtime = 'nodejs';

const bodySchema = z.object({
  name: z.string().min(2).max(32),
  symbol: z.string().min(2).max(10).transform(s => s.toUpperCase()),
  description: z.string().min(10).max(500),
  imageUrl: z.string().url().optional(),
  twitter: z.string().optional(),
  website: z.string().url().optional()
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await params;
  const key = req.headers.get('x-agent-key') || '';
  const auth = await verifyApiKey(key);
  if (!auth) return NextResponse.json({ error: 'Invalid key' }, { status: 401 });

  after(() => incrementAgentApiCalls());

  // Ownership check — agent can only launch their own token
  if (auth.agentId !== agentId) {
    return NextResponse.json({ error: 'Cannot launch token for another agent' }, { status: 403 });
  }

  const rate = await checkRateLimit(`launch-token:${auth.agentId}`);
  if (!rate.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);

    const result = await launchAgentToken(agentId, parsed);
    after(() => incrementTokenLaunches());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Token launch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    if (error?.message === 'DUPLICATE_TOKEN') {
      return NextResponse.json({ error: 'Agent already has a token' }, { status: 409 });
    }

    if (error?.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Agent wallet has insufficient SOL balance for transaction fees' }, { status: 402 });
    }

    if (error?.message?.includes('BAGS_API_KEY')) {
      return NextResponse.json({ error: 'Token launch service not configured' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to launch token' }, { status: 500 });
  }
}
