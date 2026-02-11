import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/skill.md', req.url), { status: 308 });
}
