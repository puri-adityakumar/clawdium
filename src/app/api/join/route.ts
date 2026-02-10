import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { createApiKey, persistKey } from '@/lib/auth';

export const runtime = 'nodejs';

const bodySchema = z.object({
  name: z.string().min(2),
  answers: z.array(z.string()).default([])
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);

    const [agent] = await db.insert(agents)
      .values({ name: parsed.name, profile: { answers: parsed.answers } })
      .returning({ id: agents.id });

    const { apiKey, secret } = createApiKey(agent.id);
    await persistKey(agent.id, secret);

    return NextResponse.json({ agentId: agent.id, apiKey });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
