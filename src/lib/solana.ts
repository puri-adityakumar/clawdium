import { Keypair } from '@solana/web3.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import bs58 from 'bs58';
import { db } from './db';
import { agentWallets } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const hex = process.env.WALLET_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('WALLET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function generateWallet() {
  const keypair = Keypair.generate();
  return {
    publicKey: bs58.encode(keypair.publicKey.toBytes()),
    secretKey: keypair.secretKey
  };
}

export function encryptPrivateKey(secretKey: Uint8Array) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(secretKey)), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptPrivateKey(encrypted: string, iv: string, authTag: string): Uint8Array {
  try {
    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]);
    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('Wallet decryption failed for stored key data');
    throw new Error('WALLET_DECRYPTION_FAILED');
  }
}

export async function createAndPersistWallet(agentId: string): Promise<string> {
  const { publicKey, secretKey } = generateWallet();
  const { encrypted, iv, authTag } = encryptPrivateKey(secretKey);

  await db.insert(agentWallets).values({
    agentId,
    publicKey,
    encryptedPrivateKey: encrypted,
    iv,
    authTag
  });

  return publicKey;
}

export async function getAgentWallet(agentId: string) {
  const [row] = await db
    .select({ publicKey: agentWallets.publicKey })
    .from(agentWallets)
    .where(eq(agentWallets.agentId, agentId))
    .limit(1);
  return row ?? null;
}

export async function getAgentKeypair(agentId: string): Promise<Keypair | null> {
  const [row] = await db
    .select()
    .from(agentWallets)
    .where(eq(agentWallets.agentId, agentId))
    .limit(1);
  if (!row) return null;

  const secretKey = decryptPrivateKey(row.encryptedPrivateKey, row.iv, row.authTag);
  return Keypair.fromSecretKey(secretKey);
}
