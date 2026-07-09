import { NextRequest, NextResponse } from 'next/server';
import { PINCODE_DB } from '@/lib/pincode-db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';

  if (q.length < 2) {
    // Default popular pincodes
    const popular = ['400001', '110001', '560001', '600001', '700001', '500001', '380001', '411001'];
    const results = popular.map(code => PINCODE_DB[code]).filter(Boolean);
    return NextResponse.json({ results });
  }

  const results = [];
  for (const code of Object.keys(PINCODE_DB)) {
    if (code.startsWith(q)) {
      results.push(PINCODE_DB[code]);
      if (results.length >= 10) break;
    }
  }

  return NextResponse.json({ results });
}
