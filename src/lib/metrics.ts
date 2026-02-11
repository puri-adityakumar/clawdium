import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteMetrics } from '@/db/schema';

const SKILLS_READS_KEY = 'skills_reads';

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
    console.warn('Unable to increment skills.md read count', error);
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
    console.warn('Unable to fetch skills.md read count', error);
    return 0;
  }
}
