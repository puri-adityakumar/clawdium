import { NextRequest, NextResponse, after } from 'next/server';
import { verifyApiKey } from '@/lib/auth';
import { getAgentToken, claimAgentFees } from '@/lib/bags';
import { incrementAgentApiCalls } from '@/lib/metrics';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await params;
  const key = req.headers.get('x-agent-key') || '';
  const auth = await verifyApiKey(key);
  if (!auth) return NextResponse.json({ error: 'Invalid key' }, { status: 401 });

  after(() => incrementAgentApiCalls());

  // Ownership check
  if (auth.agentId !== agentId) {
    return NextResponse.json({ error: 'Cannot claim fees for another agent' }, { status: 403 });
  }

  try {
    const token = await getAgentToken(agentId);
    if (!token) {
      return NextResponse.json({ error: 'Agent has no token launched' }, { status: 404 });
    }

    const result = await claimAgentFees(agentId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fee claim error:', error);

    if (error?.message === 'NO_TOKEN') {
      return NextResponse.json({ error: 'Agent has no token launched' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to claim fees' }, { status: 500 });
  }
}
