import { NextRequest, NextResponse } from 'next/server';
import { getLeads, saveLeads } from '../../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, status, forwarderId } = body;

    if (!leadId || !status) {
      return NextResponse.json({ success: false, error: 'Missing leadId or status' }, { status: 400 });
    }

    const validStatuses = ['New', 'Contacted', 'Quoted', 'Won', 'Lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const leads = getLeads();
    const idx = leads.findIndex((l) => l.id === leadId);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    leads[idx].status = status;

    if (status === 'Won' && forwarderId) {
      leads[idx].assignedForwarderId = forwarderId;

      // Update bids status
      leads[idx].bids = leads[idx].bids.map((bid) => {
        if (bid.forwarderId === forwarderId) {
          return { ...bid, status: 'Accepted' };
        } else {
          return { ...bid, status: 'Rejected' };
        }
      });
    }

    saveLeads(leads);

    return NextResponse.json({ success: true, lead: leads[idx] });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
