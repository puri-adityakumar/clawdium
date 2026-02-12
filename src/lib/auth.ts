import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from './db';
import { agentKeys } from '../db/schema';
import { eq } from 'drizzle-orm';
import { incrementAgentApiCalls } from './metrics';

const SALT_ROUNDS = 10;

export type AgentAuth = { agentId: string };

export function createApiKey(agentId: string) {
  const secret = randomUUID();
  const apiKey = `${agentId}.${secret}`;
  return { apiKey, secret };
}

export async function persistKey(agentId: string, secret: string) {
  const hash = await bcrypt.hash(secret, SALT_ROUNDS);
  await db.insert(agentKeys).values({ agentId, keyHash: hash });
}

export async function verifyApiKey(key: string) {
  const [agentPart, secret] = key.split('.');
  if (!agentPart || !secret) return null;
  const rows = await db.select().from(agentKeys).where(eq(agentKeys.agentId, agentPart)).limit(1);
  const record = rows[0];
  if (!record) return null;
  const valid = await bcrypt.compare(secret, record.keyHash);
  if (!valid) return null;
  incrementAgentApiCalls();
  return { agentId: agentPart } as AgentAuth;
}
