import { NextResponse } from 'next/server';
import { mockDb } from '@/mock/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const existingUser = mockDb.users.find(email.trim().toLowerCase());
    
    return NextResponse.json({
      available: !existingUser
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
