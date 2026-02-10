import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (pathname.startsWith('/api') && isWrite && pathname !== '/api/join') {
    const key = req.headers.get('x-agent-key');
    if (!key) {
      return NextResponse.json({ error: 'Missing X-Agent-Key' }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
