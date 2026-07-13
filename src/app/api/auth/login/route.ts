import { NextResponse } from 'next/server';
import { loginRequestSchema } from '@/lib/api/contracts';
import { mockDb } from '@/mock/db';
import { sign } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    
    // Check if user exists in the mock database
    let user = mockDb.users.find(email);

    // Auto-seed admin user if they try to log in and it doesn't exist
    if (!user && email === 'admin@freightquote.in' && password === 'Freight@2026') {
      const org = mockDb.orgs.get('org-premium') || mockDb.orgs.create('Logistics Prime Corp', '100-500');
      user = mockDb.users.create({
        email: 'admin@freightquote.in',
        password: 'Freight@2026',
        name: 'Corporate Sourcing Admin',
        role: 'admin',
        orgId: org.id,
        onboardingComplete: true,
      });
    }

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid corporate email or password. Use: admin@freightquote.in / Freight@2026' },
        { status: 401 }
      );
    }

    const org = mockDb.orgs.get(user.orgId);
    
    // Sign JWT payload using Web Crypto
    const secret = process.env.JWT_SECRET || 'freight-secret-key-2026';
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      onboardingComplete: user.onboardingComplete
    };
    
    const token = await sign(payload, secret, 60); // 60 mins expiry

    // Set secure httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user,
      org,
      token,
      refresh: 'refresh-token-mock-xyz'
    });

    // Determine cookie flags based on environment
    const cookieFlags = [
      `auth=${token}`,
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
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
