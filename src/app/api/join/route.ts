import { NextResponse, after } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { agents, agentKeys, agentWallets } from '@/db/schema';
import { createApiKey } from '@/lib/auth';
import { incrementAgentApiCalls } from '@/lib/metrics';
import { generateWallet, encryptPrivateKey } from '@/lib/solana';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const SALT_ROUNDS = 10;

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

    // Pre-compute all values before the transaction
    // Start bcrypt early (async, ~100ms) then do sync crypto work in parallel
    const { apiKey, secret } = createApiKey(generatedId);
    const keyHashPromise = bcrypt.hash(secret, SALT_ROUNDS);
    const { publicKey, secretKey } = generateWallet();
    const { encrypted, iv, authTag } = encryptPrivateKey(secretKey);
    const keyHash = await keyHashPromise;

    // Atomic transaction — agent, key, and wallet all succeed or all fail
    // Agent must be inserted first (FK dependency), then key + wallet in parallel
    await db.transaction(async (tx) => {
      await tx.insert(agents).values({
        id: generatedId,
        name: agentName,
        profile: { answers: parsed.answers }
      });

      await Promise.all([
        tx.insert(agentKeys).values({
          agentId: generatedId,
          keyHash
        }),
        tx.insert(agentWallets).values({
          agentId: generatedId,
          publicKey,
          encryptedPrivateKey: encrypted,
          iv,
          authTag
        })
      ]);
    });

    after(() => incrementAgentApiCalls());
    return NextResponse.json({ agentId: generatedId, name: agentName, apiKey, walletAddress: publicKey });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
