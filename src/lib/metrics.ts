import { eq, sql, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteMetrics } from '@/db/schema';

const SKILLS_READS_KEY = 'skills_reads';
const AGENT_API_CALLS_KEY = 'agent_api_calls';
const TOTAL_PAYMENTS_KEY = 'total_payments';
const TOTAL_REVENUE_USDC_KEY = 'total_revenue_usdc';
const TOTAL_TOKEN_LAUNCHES_KEY = 'total_token_launches';
const TOTAL_PREMIUM_POSTS_KEY = 'total_premium_posts';

export async function incrementSkillsReadCount() {
  try {
    await db.insert(siteMetrics)
      .values({ key: SKILLS_READS_KEY, value: 1 })
      .onConflictDoUpdate({
        target: siteMetrics.key,
        set: {
          value: sql`${siteMetrics.value} + 1`,
          updatedAt: sql`now()`
        }
      });
  } catch (error) {
    console.warn('Unable to increment skill.md read count', error);
  }
}

export async function incrementAgentApiCalls() {
  try {
    await db.insert(siteMetrics)
      .values({ key: AGENT_API_CALLS_KEY, value: 1 })
      .onConflictDoUpdate({
        target: siteMetrics.key,
        set: {
          value: sql`${siteMetrics.value} + 1`,
          updatedAt: sql`now()`
        }
      });
  } catch (error) {
    console.warn('Unable to increment agent API call count', error);
  }
}

export async function getAgentApiCallCount() {
  try {
    const [row] = await db
      .select({ value: siteMetrics.value })
      .from(siteMetrics)
      .where(eq(siteMetrics.key, AGENT_API_CALLS_KEY))
      .limit(1);

    return Number(row?.value ?? 0);
  } catch (error) {
    console.warn('Unable to fetch agent API call count', error);
    return 0;
  }
}

export async function getSkillsReadCount() {
  try {
    const [row] = await db
      .select({ value: siteMetrics.value })
      .from(siteMetrics)
      .where(eq(siteMetrics.key, SKILLS_READS_KEY))
      .limit(1);

    return Number(row?.value ?? 0);
  } catch (error) {
    console.warn('Unable to fetch skill.md read count', error);
    return 0;
  }
}

export async function incrementPaymentCount() {
  try {
    await db.insert(siteMetrics)
      .values({ key: TOTAL_PAYMENTS_KEY, value: 1 })
      .onConflictDoUpdate({
        target: siteMetrics.key,
        set: { value: sql`${siteMetrics.value} + 1`, updatedAt: sql`now()` }
      });
  } catch (error) {
    console.warn('Unable to increment payment count', error);
  }
}

export async function incrementRevenueUsdc(amount: number) {
  try {
    await db.insert(siteMetrics)
      .values({ key: TOTAL_REVENUE_USDC_KEY, value: amount })
      .onConflictDoUpdate({
        target: siteMetrics.key,
        set: { value: sql`${siteMetrics.value} + ${amount}`, updatedAt: sql`now()` }
      });
  } catch (error) {
    console.warn('Unable to increment revenue', error);
  }
}

export async function incrementTokenLaunches() {
  try {
    await db.insert(siteMetrics)
      .values({ key: TOTAL_TOKEN_LAUNCHES_KEY, value: 1 })
      .onConflictDoUpdate({
        target: siteMetrics.key,
        set: { value: sql`${siteMetrics.value} + 1`, updatedAt: sql`now()` }
      });
  } catch (error) {
    console.warn('Unable to increment token launches', error);
  }
}

export async function incrementPremiumPosts() {
  try {
    await db.insert(siteMetrics)
      .values({ key: TOTAL_PREMIUM_POSTS_KEY, value: 1 })
      .onConflictDoUpdate({
        target: siteMetrics.key,
        set: { value: sql`${siteMetrics.value} + 1`, updatedAt: sql`now()` }
      });
  } catch (error) {
    console.warn('Unable to increment premium posts', error);
  }
}

export async function getEconomicMetrics() {
  try {
    const keys = [TOTAL_PAYMENTS_KEY, TOTAL_REVENUE_USDC_KEY, TOTAL_TOKEN_LAUNCHES_KEY, TOTAL_PREMIUM_POSTS_KEY];
    const rows = await db
      .select({ key: siteMetrics.key, value: siteMetrics.value })
      .from(siteMetrics)
      .where(inArray(siteMetrics.key, keys));

    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
      totalPayments: Number(map[TOTAL_PAYMENTS_KEY] ?? 0),
      totalRevenueUsdc: Number(map[TOTAL_REVENUE_USDC_KEY] ?? 0),
      totalTokenLaunches: Number(map[TOTAL_TOKEN_LAUNCHES_KEY] ?? 0),
      totalPremiumPosts: Number(map[TOTAL_PREMIUM_POSTS_KEY] ?? 0)
    };
  } catch (error) {
    console.warn('Unable to fetch economic metrics', error);
    return { totalPayments: 0, totalRevenueUsdc: 0, totalTokenLaunches: 0, totalPremiumPosts: 0 };
  }
}
