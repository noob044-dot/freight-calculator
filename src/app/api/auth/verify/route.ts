import { NextResponse } from 'next/server';
import { verifyRequestSchema } from '@/lib/api/contracts';
import { mockDb } from '@/mock/db';
import { sign, verify } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = verifyRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token } = result.data;
    const secret = process.env.JWT_SECRET || 'freight-secret-key-2026';
    
    let userEmail: string | null = null;

    // Check if it is a real signed JWT token (contains two dots)
    if (token.split('.').length === 3) {
      const decoded = await verify(token, secret);
      if (decoded && decoded.type === 'magic-link' && typeof decoded.email === 'string') {
        userEmail = decoded.email;
      } else {
        return NextResponse.json(
          { error: 'Invalid or expired verification token.' },
          { status: 400 }
        );
      }
    } else {
      // Legacy simple mock string token format
      if (!token.startsWith('magic-link-') && !token.startsWith('mock-token-')) {
        return NextResponse.json(
          { error: 'Invalid verification token format.' },
          { status: 400 }
        );
      }
      userEmail = token.replace('magic-link-', '').replace('mock-token-', '');
    }

    const seededUser = mockDb.users.find('admin@freightquote.in'); // admin fallback
    const userToLogin = userEmail ? (mockDb.users.find(userEmail) || (userEmail.startsWith('usr-') ? null : null)) : null;
    const finalUser = userToLogin || seededUser;
    
    if (!finalUser) {
      return NextResponse.json(
        { error: 'User associated with this token could not be found.' },
        { status: 400 }
      );
    }

    const org = mockDb.orgs.get(finalUser.orgId);
    
    // Sign session JWT payload using Web Crypto
    const payload = {
      id: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
      role: finalUser.role,
      orgId: finalUser.orgId,
      onboardingComplete: finalUser.onboardingComplete
    };
    
    const jwtToken = await sign(payload, secret, 60);

    const response = NextResponse.json({
      success: true,
      user: finalUser,
      org,
      token: jwtToken,
      refresh: 'refresh-token-mock-xyz'
    });

    const cookieFlags = [
      `auth=${jwtToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=3600',
    ];
    if (process.env.NODE_ENV === 'production') {
      cookieFlags.push('Secure');
    }
    response.headers.set('Set-Cookie', cookieFlags.join('; '));

    return response;
  } catch (err) {
    console.error('Verify API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
