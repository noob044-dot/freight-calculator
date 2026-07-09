import { NextRequest, NextResponse } from 'next/server';
import { getLeads, saveLeads, Lead } from '../../../lib/db';
import { scoreLead, findMatchingForwarders } from '../../../lib/matching';
import { getPincodeData } from '../../../lib/pincode-db';

export async function GET() {
  try {
    const leads = getLeads();
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      company,
      monthlyVolume,
      originPincode,
      destPincode,
      weightKg,
      commodity,
      mode,
      calculatedCost
    } = body;

    // Validate required fields
    if (!name || !phone || !email || !originPincode || !destPincode || !weightKg || !mode) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve state names from pincodes
    const originData = getPincodeData(originPincode);
    const destData = getPincodeData(destPincode);

    if (!originData || !destData) {
      return NextResponse.json({ success: false, error: 'Invalid origin or destination pincode' }, { status: 400 });
    }

    const originState = originData.state;
    const destState = destData.state;

    // Run scoring engine
    const { score, urgency, isHot, leadCost } = scoreLead(weightKg, monthlyVolume || '1-5', mode);

    // Run matching engine
    const matchedForwarders = findMatchingForwarders(originState, destState, mode);

    // Create the lead
    const newLead: Lead = {
      id: 'lead-' + Math.random().toString(36).substr(2, 9),
      name,
      phone,
      email,
      company: company || 'N/A',
      monthlyVolume: monthlyVolume || '1-5',
      originPincode,
      destPincode,
      originState,
      destState,
      weightKg: Number(weightKg),
      commodity: commodity || 'general',
      mode,
      calculatedCost: Number(calculatedCost || 0),
      score,
      urgency,
      isHot,
      leadCost,
      createdAt: new Date().toISOString(),
      status: 'New',
      assignedForwarderId: null, // Open to matched forwarders to bid
      bids: []
    };

    // Save lead in database
    const leads = getLeads();
    leads.unshift(newLead);
    saveLeads(leads);

    // Mock Email/WhatsApp Alerts in Server Logs
    console.log(`\n==================================================`);
    console.log(`[ALERT] New Lead Created: ${newLead.id} (${newLead.isHot ? 'HOT' : 'COLD'})`);
    console.log(`Route: ${originState} (${originPincode}) -> ${destState} (${destPincode})`);
    console.log(`Matched Forwarders notified: ${matchedForwarders.map((f) => f.name).join(', ')}`);
    console.log(`SLA Timer Activated: 2-hour response window started.`);
    console.log(`==================================================\n`);

    return NextResponse.json({
      success: true,
      lead: newLead,
      matchedCount: matchedForwarders.length
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
