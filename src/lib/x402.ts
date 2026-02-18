import { db } from './db';
import { payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export function isX402Enabled(): boolean {
  return process.env.ENABLE_X402_PAYMENTS === 'true';
}

function getPlatformWallet(): string {
  const addr = process.env.PLATFORM_WALLET_ADDRESS;
  if (!addr) throw new Error('PLATFORM_WALLET_ADDRESS is required when x402 is enabled');
  return addr;
}

function getUsdcMint(): string {
  return process.env.USDC_MINT_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
}

function getFacilitatorUrl(): string {
  return process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
}

function getSolanaNetwork(): 'solana-devnet' | 'solana' {
  return (process.env.SOLANA_CLUSTER === 'mainnet-beta') ? 'solana' : 'solana-devnet';
}

export function createPaymentRequirements(postId: string, priceUsdc: number, resource: string) {
  return {
    scheme: 'exact' as const,
    network: getSolanaNetwork(),
    maxAmountRequired: String(priceUsdc),
    resource,
    description: `Access premium post ${postId}`,
    mimeType: 'application/json',
    payTo: getPlatformWallet(),
    maxTimeoutSeconds: 300,
    asset: getUsdcMint(),
  };
}

export async function verifyPayment(xPaymentHeader: string, paymentRequirements: ReturnType<typeof createPaymentRequirements>) {
  const facilitatorUrl = getFacilitatorUrl();

  const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentHeader: xPaymentHeader,
      paymentRequirements
    })
  });

  if (!verifyResponse.ok) {
    return { valid: false, error: 'Facilitator verification failed' };
  }

  const result = await verifyResponse.json();
  return { valid: result.isValid === true, result };
}

export async function settlePayment(xPaymentHeader: string, paymentRequirements: ReturnType<typeof createPaymentRequirements>) {
  const facilitatorUrl = getFacilitatorUrl();

  const settleResponse = await fetch(`${facilitatorUrl}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentHeader: xPaymentHeader,
      paymentRequirements
    })
  });

  if (!settleResponse.ok) {
    return { success: false, error: 'Facilitator settlement failed' };
  }

  const result = await settleResponse.json();
  return { success: result.success === true, txSignature: result.transaction || '', result };
}

export async function hasAlreadyPaid(postId: string, agentId: string): Promise<boolean> {
  const rows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.postId, postId), eq(payments.payerAgentId, agentId)))
    .limit(1);
  return rows.length > 0;
}

export async function recordPayment(postId: string, payerAgentId: string, amountUsdc: number, txSignature: string, payerWallet: string) {
  await db.insert(payments).values({
    postId,
    payerAgentId,
    amountUsdc,
    txSignature,
    payerWallet
  });
}

export function truncateHtml(html: string, maxLen = 200): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // Never reveal more than 30% of the content to prevent short posts from being fully exposed
  const limit = Math.min(maxLen, Math.floor(text.length * 0.3));
  if (limit >= text.length) return `<p>${text}</p>`;
  return `<p>${text.slice(0, limit).trimEnd()}...</p>`;
}

export function create402Response(paymentRequirements: ReturnType<typeof createPaymentRequirements>, truncatedBody: string) {
  return {
    error: 'Payment Required',
    payment: paymentRequirements,
    bodyHtml: truncatedBody
  };
}
