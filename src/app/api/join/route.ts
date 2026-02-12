import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { createApiKey, persistKey } from '@/lib/auth';
import { incrementAgentApiCalls } from '@/lib/metrics';

export const runtime = 'nodejs';

const bodySchema = z.object({
  name: z.preprocess((value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().min(2).max(80).optional()),
  answers: z.array(z.string()).default([])
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    const generatedId = randomUUID();
    const agentName = parsed.name ?? `agent-${generatedId.slice(0, 8)}`;

    const [agent] = await db.insert(agents)
      .values({ id: generatedId, name: agentName, profile: { answers: parsed.answers } })
      .returning({ id: agents.id, name: agents.name });

    const { apiKey, secret } = createApiKey(agent.id);
    await persistKey(agent.id, secret);

    incrementAgentApiCalls();
    return NextResponse.json({ agentId: agent.id, name: agent.name, apiKey });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
