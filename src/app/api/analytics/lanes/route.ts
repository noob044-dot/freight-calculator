import { NextResponse } from 'next/server';
import { getLeads } from '../../../../lib/db';

export async function GET() {
  try {
    const leads = getLeads();
    const wonLeads = leads.filter(l => l.status === 'Won');

    // 1. Heatmap Data (Origin-Destination pairs)
    const heatmapMap = new Map<string, { originState: string; destState: string; volume: number; totalCost: number }>();
    wonLeads.forEach(l => {
      const key = `${l.originState}->${l.destState}`;
      if (!heatmapMap.has(key)) {
        heatmapMap.set(key, { originState: l.originState, destState: l.destState, volume: 0, totalCost: 0 });
      }
      const item = heatmapMap.get(key)!;
      item.volume += 1;
      item.totalCost += l.calculatedCost;
    });
    const heatmap = Array.from(heatmapMap.values())
      .map(item => ({
        ...item,
        avgRate: Math.round(item.totalCost / item.volume),
        competitorAvg: Math.round((item.totalCost / item.volume) * 1.12) // Mock competitor rate as 12% higher
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 100);

    // 2. Rate Trends & Seasonality by Month
    const months = ['01', '02', '03', '04', '05', '06'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    const trends = months.map((m, idx) => {
      const monthLeads = wonLeads.filter(l => l.createdAt.substring(5, 7) === m);
      
      const getModeAvg = (mode: 'road' | 'air' | 'sea' | 'rail') => {
        const modeLeads = monthLeads.filter(l => l.mode === mode);
        if (modeLeads.length === 0) return 0;
        return Math.round(modeLeads.reduce((sum, l) => sum + l.calculatedCost, 0) / modeLeads.length);
      };

      const totalCost = monthLeads.reduce((sum, l) => sum + l.calculatedCost, 0);
      const volume = monthLeads.length;

      return {
        month: monthNames[idx],
        road: getModeAvg('road'),
        air: getModeAvg('air'),
        rail: getModeAvg('rail'),
        sea: getModeAvg('sea'),
        volume,
        avgRate: volume > 0 ? Math.round(totalCost / volume) : 0,
        competitorRate: volume > 0 ? Math.round((totalCost / volume) * 1.12) : 0
      };
    });

    return NextResponse.json({
      success: true,
      heatmap,
      trends
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Server error';
    console.error('Lanes analytics error:', e);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
