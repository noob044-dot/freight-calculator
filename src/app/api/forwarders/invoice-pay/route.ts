import { NextRequest, NextResponse } from 'next/server';
import { getInvoices, saveInvoices } from '../../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });
    }

    const invoices = getInvoices();
    const idx = invoices.findIndex((inv) => inv.id === invoiceId);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    invoices[idx].status = 'Paid';
    invoices[idx].paidAt = new Date().toISOString();
    saveInvoices(invoices);

    // Mock Razorpay payment log in the terminal
    console.log(`\n==================================================`);
    console.log(`[RAZORPAY PAYMENT MOCK SUCCESS]`);
    console.log(`Invoice Paid: ${invoiceId}`);
    console.log(`Amount Received: ₹${invoices[idx].total}`);
    console.log(`Forwarder: ${invoices[idx].forwarderName}`);
    console.log(`Transaction Ref: pay_${Math.random().toString(36).substr(2, 9)}`);
    console.log(`==================================================\n`);

    return NextResponse.json({ success: true, invoice: invoices[idx] });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
