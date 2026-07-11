import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude login page, quote API, Next.js internal files, and public assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/quote') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  
  const user = process.env.PRIVATE_USER || 'admin';
  const pass = process.env.PRIVATE_PASS || 'admin123';

  // Use btoa for Base64 encoding compatible with the Next.js Edge Runtime
  const expectedAuth = 'Basic ' + btoa(`${user}:${pass}`);

  if (!authHeader || authHeader !== expectedAuth) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="FreightQuote Private"',
      },
    });
  }

  return NextResponse.next();
}
