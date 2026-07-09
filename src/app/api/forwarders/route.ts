import { NextRequest, NextResponse } from 'next/server';
import { getForwarders, saveForwarders, getInvoices } from '../../../lib/db';

export async function GET() {
  try {
    const forwarders = getForwarders();
    const invoices = getInvoices();
    return NextResponse.json({ success: true, forwarders, invoices });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { forwarderId, rateCard } = body;

    if (!forwarderId || !rateCard) {
      return NextResponse.json({ success: false, error: 'Missing forwarderId or rateCard' }, { status: 400 });
    }

    const forwarders = getForwarders();
    const idx = forwarders.findIndex((f) => f.id === forwarderId);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Forwarder not found' }, { status: 404 });
    }

    // Update the rate card
    forwarders[idx].rateCard = rateCard;
    saveForwarders(forwarders);

    return NextResponse.json({ success: true, forwarder: forwarders[idx] });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
