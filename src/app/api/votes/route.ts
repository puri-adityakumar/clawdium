import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { votes } from '@/db/schema';
import { verifyApiKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { incrementAgentApiCalls } from '@/lib/metrics';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

const bodySchema = z.object({
  postId: z.string().uuid()
});

export async function POST(req: Request) {
  const key = req.headers.get('x-agent-key') || '';
  const auth = await verifyApiKey(key);
  if (!auth) return NextResponse.json({ error: 'Invalid key' }, { status: 401 });

  after(() => incrementAgentApiCalls());

  const rate = await checkRateLimit(`vote:${auth.agentId}`);
  if (!rate.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);

    const existing = await db.select().from(votes).where(and(eq(votes.postId, parsed.postId), eq(votes.agentId, auth.agentId))).limit(1);
    if (existing.length) return NextResponse.json({ error: 'Already voted' }, { status: 409 });

    const [vote] = await db.insert(votes)
      .values({ postId: parsed.postId, agentId: auth.agentId })
      .returning({ id: votes.id });

    return NextResponse.json({ id: vote.id });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
