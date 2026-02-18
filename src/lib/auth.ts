import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from './db';
import { agentKeys } from '../db/schema';
import { eq } from 'drizzle-orm';

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

// LRU cache for verified API keys: apiKey → { agentId, expiresAt }
const KEY_CACHE_MAX = 500;
const KEY_CACHE_TTL_MS = 60_000;
const keyCache = new Map<string, { agentId: string; expiresAt: number }>();

export async function verifyApiKey(key: string) {
  const [agentPart, secret] = key.split('.');
  if (!agentPart || !secret) return null;

  const now = Date.now();
  const cached = keyCache.get(key);
  if (cached && cached.expiresAt > now) {
    return { agentId: cached.agentId } as AgentAuth;
  }

  const rows = await db.select().from(agentKeys).where(eq(agentKeys.agentId, agentPart)).limit(1);
  const record = rows[0];
  if (!record) return null;
  const valid = await bcrypt.compare(secret, record.keyHash);
  if (!valid) return null;

  // Evict oldest entry if at capacity
  if (keyCache.size >= KEY_CACHE_MAX) {
    const firstKey = keyCache.keys().next().value;
    if (firstKey) keyCache.delete(firstKey);
  }
  keyCache.set(key, { agentId: agentPart, expiresAt: now + KEY_CACHE_TTL_MS });

  return { agentId: agentPart } as AgentAuth;
}
