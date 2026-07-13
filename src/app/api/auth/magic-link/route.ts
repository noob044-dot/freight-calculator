import { NextResponse } from 'next/server';
import { magicLinkRequestSchema } from '@/lib/api/contracts';
import { mockDb } from '@/mock/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = magicLinkRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    
    // Find or create user
    let user = mockDb.users.find(email);
    if (!user) {
      // Auto-create user for demo ease
      const org = mockDb.orgs.create(`${email.split('@')[0]} Org`, '1-10');
      user = mockDb.users.create({
        email,
        name: email.split('@')[0],
        role: 'Shipper',
        orgId: org.id,
        onboardingComplete: false,
      });
    }

    const token = `magic-link-${user.id}`;
    
    // Simulate sending email via Resend
    console.log(`[SIMULATOR] Outbound email dispatched via Resend:
      To: ${email}
      Subject: Login Magic Link
      Link: http://localhost:3000/login?token=${token}`);

    return NextResponse.json({
      success: true,
      message: 'Magic link generated. Check the terminal console output to click the verification link.',
      token
    });
  } catch (err) {
    console.error('Magic link API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
