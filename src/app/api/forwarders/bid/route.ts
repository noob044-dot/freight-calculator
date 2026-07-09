import { NextRequest, NextResponse } from 'next/server';
import { getLeads, saveLeads, getForwarders, Bid } from '../../../../lib/db';
import { billForwarderForLead } from '../../../../lib/billing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, forwarderId, amount, transitDays, remarks } = body;

    if (!leadId || !forwarderId || !amount || !transitDays) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const leads = getLeads();
    const leadIdx = leads.findIndex((l) => l.id === leadId);

    if (leadIdx === -1) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const forwarders = getForwarders();
    const forwarder = forwarders.find((f) => f.id === forwarderId);

    if (!forwarder) {
      return NextResponse.json({ success: false, error: 'Forwarder not found' }, { status: 404 });
    }

    // Check if the forwarder has already placed a bid
    const existingBidIdx = leads[leadIdx].bids.findIndex((b) => b.forwarderId === forwarderId);

    const newBid: Bid = {
      forwarderId,
      forwarderName: forwarder.name,
      amount: Number(amount),
      transitDays: Number(transitDays),
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      remarks: remarks || ''
    };

    if (existingBidIdx > -1) {
      // Update existing bid
      leads[leadIdx].bids[existingBidIdx] = newBid;
    } else {
      // Add new bid
      leads[leadIdx].bids.push(newBid);
      // Invoice the forwarder for this lead
      billForwarderForLead(forwarderId, leads[leadIdx]);
    }

    // Update lead status to Quoted if it is currently New or Contacted
    if (leads[leadIdx].status === 'New' || leads[leadIdx].status === 'Contacted') {
      leads[leadIdx].status = 'Quoted';
    }

    saveLeads(leads);

    return NextResponse.json({ success: true, bid: newBid });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
