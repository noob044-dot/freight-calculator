import { NextResponse } from 'next/server';
import { registerRequestSchema } from '@/lib/api/contracts';
import { mockDb } from '@/mock/db';
import { sign } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { company, contactName, email, password, role, orgSize } = result.data;
    
    // Check if user already exists
    const existingUser = mockDb.users.find(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'A corporate account with this email address already exists.' },
        { status: 400 }
      );
    }

    // 1. Create Organization in the mock database
    const org = mockDb.orgs.create(company, orgSize);
    
    // 2. Create User linked to the organization
    const user = mockDb.users.create({
      email: email.trim().toLowerCase(),
      password,
      name: contactName,
      role: role === 'Forwarder' ? 'Forwarder' : 'Shipper',
      orgId: org.id,
      onboardingComplete: false, // Must run through onboarding
    });

    // 3. Generate magic link token (JWT, 10min expiry, type: 'magic-link')
    const secret = process.env.JWT_SECRET || 'freight-secret-key-2026';
    const magicToken = await sign(
      { email: user.email, type: 'magic-link' },
      secret,
      10 // 10 minutes expiry
    );

    // 4. Simulate email
    console.log('📧 MAGIC LINK:', `/auth/verify?token=${magicToken}`);

    return NextResponse.json({
      success: true,
      message: 'Registration successful. A verification email has been simulated and logged to the console.',
      token: magicToken,
      userId: user.id,
      orgId: org.id
    });
  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
