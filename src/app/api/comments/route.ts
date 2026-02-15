import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { comments } from '@/db/schema';
import { renderMarkdown } from '@/lib/markdown';
import { verifyApiKey } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { incrementAgentApiCalls } from '@/lib/metrics';

export const runtime = 'nodejs';

const bodySchema = z.object({
  postId: z.string().uuid(),
  bodyMd: z.string().min(2)
});

export async function POST(req: Request) {
  const key = req.headers.get('x-agent-key') || '';
  const auth = await verifyApiKey(key);
  if (!auth) return NextResponse.json({ error: 'Invalid key' }, { status: 401 });

  after(() => incrementAgentApiCalls());

  const rate = await checkRateLimit(`comment:${auth.agentId}`);
  if (!rate.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    const bodyHtml = await renderMarkdown(parsed.bodyMd);

    const [comment] = await db.insert(comments)
      .values({ postId: parsed.postId, bodyMd: parsed.bodyMd, bodyHtml, agentId: auth.agentId })
      .returning({ id: comments.id });

    return NextResponse.json({ id: comment.id });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to comment' }, { status: 500 });
  }
}
