import { NextRequest, NextResponse } from 'next/server';
import { calculateRoadFTL } from '@/lib/road-engine';
import { calculateAir } from '@/lib/air-engine';
import { calculateSea } from '@/lib/sea-engine';
import { calculateRail } from '@/lib/rail-engine';
import { QuoteInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'road';

    const body = await request.json();
    
    const input: QuoteInput = {
      originPincode: body.originPincode,
      destPincode: body.destPincode,
      weightKg: Number(body.weightKg),
      commodity: body.commodity || 'general',
      vehicleType: body.vehicleType,
      valueInr: body.valueInr ? Number(body.valueInr) : undefined,
      dimensions: body.dimensions,
      containerType: body.containerType,
      incoterm: body.incoterm,
    };

    if (!input.originPincode || !input.destPincode || !input.weightKg) {
      return NextResponse.json(
        { error: 'Missing required fields: originPincode, destPincode, weightKg' },
        { status: 400 }
      );
    }

    const getBenchmark = (total: number) => ({
      freightosIndex: Math.round(total * 0.99),
      cogoport: Math.round(total * 1.08),
      freightwalla: Math.round(total * 1.12),
      delex: Math.round(total * 1.05),
      average: Math.round(total * 1.07),
      savingsVsAverage: Math.round(total * 0.07),
    });

    if (mode === 'all') {
      const [road, air, sea, rail] = await Promise.all([
        calculateRoadFTL(input).catch(err => ({ error: err.message })),
        calculateAir(input).catch(err => ({ error: err.message })),
        calculateSea(input).catch(err => ({ error: err.message })),
        calculateRail(input).catch(err => ({ error: err.message })),
      ]);

      return NextResponse.json({
        success: true,
        mode: 'all',
        quotes: { road, air, sea, rail },
        benchmarks: {
          road: 'error' in road ? null : getBenchmark(road.total),
          air: 'error' in air ? null : getBenchmark(air.total),
          sea: 'error' in sea ? null : getBenchmark(sea.total),
          rail: 'error' in rail ? null : getBenchmark(rail.total),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Handle single mode
    let result;
    if (mode === 'road') {
      result = await calculateRoadFTL(input);
    } else if (mode === 'air') {
      result = await calculateAir(input);
    } else if (mode === 'sea') {
      result = await calculateSea(input);
    } else if (mode === 'rail') {
      result = await calculateRail(input);
    } else {
      return NextResponse.json({ error: `Unsupported mode: ${mode}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mode,
      quote: result,
      benchmark: getBenchmark(result.total),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Quote calculation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Calculation failed' },
      { status: 500 }
    );
  }
}