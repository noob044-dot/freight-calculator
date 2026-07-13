import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from '@/lib/jwt';

// In-memory Rate Limiter Map for Edge runtime compatibility (NO localStorage/Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = (request as unknown as { ip?: string }).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // --- 1. RATE LIMITER GATING (In-Memory Map) ---
  const now = Date.now();
  let rateRecord = rateLimitMap.get(ip);

  if (!rateRecord || now > rateRecord.resetAt) {
    rateRecord = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, rateRecord);
  } else {
    rateRecord.count += 1;
  }

  if (rateRecord.count > RATE_LIMIT_MAX) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Rate limit exceeded." }),
      { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateRecord.resetAt - now) / 1000).toString()
        } 
      }
    );
  }

  // Allow auth API endpoints to bypass credentials gating
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // --- 2. AUTH GATING & JWT VERIFICATION ---
  const authCookie = request.cookies.get('auth')?.value;
  const secret = process.env.JWT_SECRET || 'freight-secret-key-2026';

  let userPayload = null;
  if (authCookie) {
    userPayload = await verify(authCookie, secret);
  }

  // If unauthenticated, redirect to login page with callbackUrl parameter
  if (!userPayload) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve requested path to support deep link redirects post-auth
    loginUrl.searchParams.set('redirect', pathname);
    
    // For API requests, return 401 response instead of HTML redirect
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized. Please authenticate." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return NextResponse.redirect(loginUrl);
  }

  // --- 3. HEADER PROPAGATION ---
  // Attach user payload as a base64url or stringified header for downstream API usage
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user', JSON.stringify(userPayload));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Intercept calculate, dashboard, API (except auth), and onboarding folders
export const config = {
  matcher: [
    '/calculate/:path*',
    '/dashboard/:path*',
    '/api/:path*',
    '/onboarding/:path*'
  ],
};
