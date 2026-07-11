import { NextResponse } from 'next/server';
import { getLeads } from '../../../../lib/db';

export async function GET() {
  try {
    const leads = getLeads();
    const wonLeads = leads.filter(l => l.status === 'Won');

    // 1. Cost vs Quote breakdown (overall averages for Waterfall chart)
    let totalForwarderCost = 0;
    let totalQuoteAmount = 0;
    wonLeads.forEach(l => {
      const winningBid = l.bids.find(b => b.status === 'Accepted');
      if (winningBid) {
        totalForwarderCost += winningBid.amount;
      } else {
        totalForwarderCost += l.calculatedCost * 0.94; // fallback
      }
      totalQuoteAmount += l.calculatedCost;
    });

    const avgForwarderCost = wonLeads.length > 0 ? Math.round(totalForwarderCost / wonLeads.length) : 0;
    const avgQuoteAmount = wonLeads.length > 0 ? Math.round(totalQuoteAmount / wonLeads.length) : 0;
    const avgPlatformMarkup = avgQuoteAmount - avgForwarderCost;

    // Waterfall format: base, cost, markup, total
    const waterfall = [
      { name: 'Base Cost', value: avgForwarderCost, display: avgForwarderCost },
      { name: 'Platform Markup', value: avgPlatformMarkup, display: avgPlatformMarkup },
      { name: 'Total Quote', value: avgQuoteAmount, display: avgQuoteAmount }
    ];

    // 2. Platform Share vs Forwarder Share over time (Stacked Bar)
    const months = ['01', '02', '03', '04', '05', '06'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    const shareTrends = months.map((m, idx) => {
      const monthLeads = wonLeads.filter(l => l.createdAt.substring(5, 7) === m);
      
      let fwdShareTotal = 0;
      let platShareTotal = 0;

      monthLeads.forEach(l => {
        const winningBid = l.bids.find(b => b.status === 'Accepted');
        const fwdAmount = winningBid ? winningBid.amount : l.calculatedCost * 0.94;
        fwdShareTotal += fwdAmount;
        platShareTotal += (l.calculatedCost - fwdAmount);
      });

      const count = monthLeads.length;

      return {
        month: monthNames[idx],
        forwarderShare: count > 0 ? Math.round(fwdShareTotal / count) : 0,
        platformShare: count > 0 ? Math.round(platShareTotal / count) : 0
      };
    });

    // 3. Commodity Profitability
    const commodityGroups = new Map<string, { totalQuote: number; totalCost: number; shipments: number }>();
    
    wonLeads.forEach(l => {
      const winningBid = l.bids.find(b => b.status === 'Accepted');
      const cost = winningBid ? winningBid.amount : l.calculatedCost * 0.94;
      
      if (!commodityGroups.has(l.commodity)) {
        commodityGroups.set(l.commodity, { totalQuote: 0, totalCost: 0, shipments: 0 });
      }
      const group = commodityGroups.get(l.commodity)!;
      group.totalQuote += l.calculatedCost;
      group.totalCost += cost;
      group.shipments += 1;
    });

    const commodityProfitability = Array.from(commodityGroups.entries()).map(([commodity, data]) => {
      const marginAmt = data.totalQuote - data.totalCost;
      const marginPct = data.totalQuote > 0 ? Number(((marginAmt / data.totalQuote) * 100).toFixed(2)) : 0;
      return {
        commodity: commodity.toUpperCase(),
        shipments: data.shipments,
        revenue: data.totalQuote,
        cost: data.totalCost,
        marginAmount: marginAmt,
        marginPercent: marginPct
      };
    }).sort((a, b) => b.marginPercent - a.marginPercent);

    return NextResponse.json({
      success: true,
      waterfall,
      shareTrends,
      commodityProfitability
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Server error';
    console.error('Margins analytics error:', e);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
