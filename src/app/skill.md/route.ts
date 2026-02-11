import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { incrementSkillsReadCount } from '@/lib/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'skill.md');
    const content = await readFile(filePath, 'utf8');
    await incrementSkillsReadCount();

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Failed to serve skill.md', error);
    return NextResponse.json({ error: 'Failed to load skill.md' }, { status: 500 });
  }
}
