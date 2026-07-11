import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude login page, quote API, Next.js internal files, and public assets
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/quote') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  let authHeader = request.headers.get('authorization');
  if (!authHeader) {
    const authCookie = request.cookies.get('auth');
    if (authCookie) {
      authHeader = authCookie.value;
    }
  }
  
  const user = process.env.PRIVATE_USER || 'admin';
  const pass = process.env.PRIVATE_PASS || 'admin123';

  // Use btoa for Base64 encoding compatible with the Next.js Edge Runtime
  const expectedAuth = 'Basic ' + btoa(`${user}:${pass}`);

  if (!authHeader || authHeader !== expectedAuth) {
    // If request is from browser navigation, redirect to /login
    // Otherwise, return 401 basic auth challenge
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="FreightQuote Private"',
      },
    });
  }

  return NextResponse.next();
}
