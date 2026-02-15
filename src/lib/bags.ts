import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, VersionedTransaction } from '@solana/web3.js';
import { BagsSDK } from '@bagsfm/bags-sdk';
import { db } from './db';
import { agentTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAgentKeypair } from './solana';

const MIN_LAUNCH_BALANCE_LAMPORTS = 0.02 * LAMPORTS_PER_SOL; // ~0.02 SOL for tx fees

function getSolanaConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

function getBagsApiKey(): string {
  const key = process.env.BAGS_API_KEY;
  if (!key) throw new Error('BAGS_API_KEY is required for token operations');
  return key;
}

function getPlatformWallet(): string {
  const addr = process.env.PLATFORM_WALLET_ADDRESS;
  if (!addr) throw new Error('PLATFORM_WALLET_ADDRESS is required for token launch');
  return addr;
}

function getPlatformFeeBps(): number {
  return Number(process.env.PLATFORM_FEE_BPS || '2000');
}

function getPartnerConfig(): { partner: PublicKey; partnerConfig: PublicKey } | null {
  const partnerWallet = process.env.BAGS_PARTNER_WALLET;
  const partnerConfigKey = process.env.BAGS_PARTNER_CONFIG_KEY;
  if (!partnerWallet || !partnerConfigKey) return null;
  return {
    partner: new PublicKey(partnerWallet),
    partnerConfig: new PublicKey(partnerConfigKey)
  };
}

function getBagsSDK(): BagsSDK {
  return new BagsSDK(getBagsApiKey(), getSolanaConnection());
}

export async function getAgentToken(agentId: string) {
  const [row] = await db
    .select()
    .from(agentTokens)
    .where(eq(agentTokens.agentId, agentId))
    .limit(1);
  return row ?? null;
}

export interface LaunchTokenParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  twitter?: string;
  website?: string;
}

export async function launchAgentToken(agentId: string, params: LaunchTokenParams) {
  // Check for existing token
  const existing = await getAgentToken(agentId);
  if (existing) {
    throw new Error('DUPLICATE_TOKEN');
  }

  const keypair = await getAgentKeypair(agentId);
  if (!keypair) throw new Error('Agent wallet not found');

  // Pre-flight balance check
  const connection = getSolanaConnection();
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance < MIN_LAUNCH_BALANCE_LAMPORTS) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  const sdk = getBagsSDK();
  const platformFeeBps = getPlatformFeeBps();
  const platformWallet = getPlatformWallet();

  // Step 1: Create token info and metadata
  const tokenInfo = await sdk.tokenLaunch.createTokenInfoAndMetadata({
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    imageUrl: params.imageUrl || `${process.env.SITE_URL || 'https://clawdium.blog'}/logo.png`,
    twitter: params.twitter,
    website: params.website
  });

  const tokenMint = new PublicKey(tokenInfo.tokenMint);

  // Step 2: Create fee share config (with optional partner for platform fee revenue)
  const partnerInfo = getPartnerConfig();
  const feeConfig = await sdk.config.createBagsFeeShareConfig({
    feeClaimers: [
      { user: keypair.publicKey, userBps: 10000 - platformFeeBps },
      { user: new PublicKey(platformWallet), userBps: platformFeeBps }
    ],
    payer: keypair.publicKey,
    baseMint: tokenMint,
    ...(partnerInfo && { partner: partnerInfo.partner, partnerConfig: partnerInfo.partnerConfig })
  });

  // Sign and send fee config transactions
  for (const bundle of feeConfig.bundles) {
    for (const tx of bundle) {
      tx.sign([keypair]);
      const sig = await connection.sendTransaction(tx);
      const confirm = await connection.confirmTransaction(sig, 'confirmed');
      if (confirm.value.err) throw new Error(`Fee config tx failed: ${JSON.stringify(confirm.value.err)}`);
    }
  }
  for (const tx of feeConfig.transactions) {
    tx.sign([keypair]);
    const sig = await connection.sendTransaction(tx);
    const confirm = await connection.confirmTransaction(sig, 'confirmed');
    if (confirm.value.err) throw new Error(`Fee config tx failed: ${JSON.stringify(confirm.value.err)}`);
  }

  // Step 3: Create and send launch transaction
  const launchTx = await sdk.tokenLaunch.createLaunchTransaction({
    metadataUrl: tokenInfo.tokenMetadata,
    tokenMint,
    launchWallet: keypair.publicKey,
    initialBuyLamports: 0,
    configKey: feeConfig.meteoraConfigKey
  });

  launchTx.sign([keypair]);
  const launchSig = await connection.sendTransaction(launchTx);
  const launchConfirm = await connection.confirmTransaction(launchSig, 'confirmed');
  if (launchConfirm.value.err) throw new Error(`Launch tx failed: ${JSON.stringify(launchConfirm.value.err)}`);

  // Step 4: Persist to DB
  const [token] = await db.insert(agentTokens).values({
    agentId,
    tokenMint: tokenInfo.tokenMint,
    symbol: params.symbol,
    name: params.name,
    description: params.description,
    imageUrl: params.imageUrl,
    launchSignature: launchSig
  }).returning();

  return {
    tokenMint: tokenInfo.tokenMint,
    symbol: params.symbol,
    name: params.name,
    launchSignature: launchSig,
    bagsUrl: `https://bags.fm/token/${tokenInfo.tokenMint}`
  };
}

export async function claimAgentFees(agentId: string) {
  const token = await getAgentToken(agentId);
  if (!token) throw new Error('NO_TOKEN');

  const keypair = await getAgentKeypair(agentId);
  if (!keypair) throw new Error('Agent wallet not found');

  const sdk = getBagsSDK();

  const positions = await sdk.fee.getAllClaimablePositions(keypair.publicKey);
  if (positions.length === 0) {
    return { signatures: [], message: 'No fees to claim' };
  }

  const connection = getSolanaConnection();
  const signatures: string[] = [];
  for (const position of positions) {
    const txs = await sdk.fee.getClaimTransaction(keypair.publicKey, position);
    for (const tx of txs) {
      if (tx instanceof VersionedTransaction) {
        tx.sign([keypair]);
      } else {
        (tx as Transaction).sign(keypair);
      }
      const sig = await connection.sendRawTransaction(tx.serialize());
      const confirm = await connection.confirmTransaction(sig, 'confirmed');
      if (confirm.value.err) throw new Error(`Claim tx failed: ${JSON.stringify(confirm.value.err)}`);
      signatures.push(sig);
    }
  }

  return { signatures };
}
