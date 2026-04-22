import { db } from './db';
import { payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type MintSymbol = 'usdc' | 'audd';
export type Prices = { usdc?: number; audd?: number };

export type PaymentRequirement = {
  scheme: 'exact';
  network: 'solana' | 'solana-devnet';
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: 'application/json';
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
};

export function isX402Enabled(): boolean {
  return process.env.ENABLE_X402_PAYMENTS === 'true';
}

function getPlatformWallet(): string {
  const addr = process.env.PLATFORM_WALLET_ADDRESS;
  if (!addr) throw new Error('PLATFORM_WALLET_ADDRESS is required when x402 is enabled');
  return addr;
}

export function getUsdcMint(): string {
  return process.env.USDC_MINT_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
}

export function getAuddMint(): string {
  return process.env.AUDD_MINT_ADDRESS || 'AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw';
}

function getFacilitatorUrl(): string {
  return process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
}

function getSolanaNetwork(): 'solana-devnet' | 'solana' {
  return (process.env.SOLANA_CLUSTER === 'mainnet-beta') ? 'solana' : 'solana-devnet';
}

export function mintSymbolFor(mint: string): MintSymbol | null {
  if (mint === getUsdcMint()) return 'usdc';
  if (mint === getAuddMint()) return 'audd';
  return null;
}

function mintFor(symbol: MintSymbol): string {
  return symbol === 'usdc' ? getUsdcMint() : getAuddMint();
}

export function createPaymentRequirements(postId: string, prices: Prices, resource: string): PaymentRequirement[] {
  const requirements: PaymentRequirement[] = [];
  const base = {
    scheme: 'exact' as const,
    network: getSolanaNetwork(),
    resource,
    description: `Access premium post ${postId}`,
    mimeType: 'application/json' as const,
    payTo: getPlatformWallet(),
    maxTimeoutSeconds: 300,
  };

  if (prices.usdc && prices.usdc > 0) {
    requirements.push({ ...base, maxAmountRequired: String(prices.usdc), asset: getUsdcMint() });
  }
  if (prices.audd && prices.audd > 0) {
    requirements.push({ ...base, maxAmountRequired: String(prices.audd), asset: getAuddMint() });
  }
  return requirements;
}

export type VerifyResult =
  | { valid: true; matchedRequirement: PaymentRequirement; mintSymbol: MintSymbol; result: unknown }
  | { valid: false; error: string };

export async function verifyPayment(xPaymentHeader: string, requirements: PaymentRequirement[]): Promise<VerifyResult> {
  const facilitatorUrl = getFacilitatorUrl();

  for (const req of requirements) {
    try {
      const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentHeader: xPaymentHeader, paymentRequirements: req })
      });

      if (!verifyResponse.ok) continue;
      const result = await verifyResponse.json();
      if (result.isValid !== true) continue;

      const mintSymbol = mintSymbolFor(req.asset);
      if (!mintSymbol) continue;
      return { valid: true, matchedRequirement: req, mintSymbol, result };
    } catch {
      continue;
    }
  }

  return { valid: false, error: 'No matching payment requirement validated' };
}

export type SettleResult = { success: true; txSignature: string; result: unknown } | { success: false; error: string };

export async function settlePayment(xPaymentHeader: string, matchedRequirement: PaymentRequirement): Promise<SettleResult> {
  const facilitatorUrl = getFacilitatorUrl();

  const settleResponse = await fetch(`${facilitatorUrl}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentHeader: xPaymentHeader, paymentRequirements: matchedRequirement })
  });

  if (!settleResponse.ok) return { success: false, error: 'Facilitator settlement failed' };
  const result = await settleResponse.json();
  if (result.success !== true) return { success: false, error: 'Settlement rejected by facilitator' };
  return { success: true, txSignature: result.transaction || '', result };
}

export async function hasAlreadyPaid(postId: string, agentId: string): Promise<boolean> {
  const rows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.postId, postId), eq(payments.payerAgentId, agentId)))
    .limit(1);
  return rows.length > 0;
}

export type RecordPaymentInput = {
  postId: string;
  payerAgentId: string;
  mintSymbol: MintSymbol;
  amount: number;
  txSignature: string;
  payerWallet: string;
};

export async function recordPayment(input: RecordPaymentInput) {
  const mint = mintFor(input.mintSymbol);
  await db.insert(payments).values({
    postId: input.postId,
    payerAgentId: input.payerAgentId,
    amountUsdc: input.mintSymbol === 'usdc' ? input.amount : null,
    amountAudd: input.mintSymbol === 'audd' ? input.amount : null,
    paymentMint: mint,
    txSignature: input.txSignature,
    payerWallet: input.payerWallet
  });
}

export function truncateHtml(html: string, maxLen = 200): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const limit = Math.min(maxLen, Math.floor(text.length * 0.3));
  if (limit >= text.length) return `<p>${text}</p>`;
  return `<p>${text.slice(0, limit).trimEnd()}...</p>`;
}

export function create402Response(requirements: PaymentRequirement[], truncatedBody: string) {
  return {
    x402Version: 1,
    error: 'Payment Required',
    accepts: requirements,
    bodyHtml: truncatedBody
  };
}
