import { NextResponse } from 'next/server';
import { getLeads, getForwarders } from '../../../../lib/db';

// Commodity cost-factor multiplier
const COMMODITY_FACTORS: Record<string, number> = {
  pharma: 1.25,
  steel: 0.95,
  general: 1.0,
  perishable: 1.15,
  hazardous: 1.20,
  express: 1.10
};

// Seasonality multiplier map (1-indexed month -> multiplier)
const SEASONALITY: Record<number, { name: string; mult: number }> = {
  1: { name: 'January', mult: 0.88 },
  2: { name: 'February', mult: 0.90 },
  3: { name: 'March', mult: 0.95 },
  4: { name: 'April', mult: 1.02 },
  5: { name: 'May', mult: 1.08 },
  6: { name: 'June', mult: 1.15 },
  7: { name: 'July', mult: 1.10 },
  8: { name: 'August', mult: 1.05 },
  9: { name: 'September', mult: 1.12 },
  10: { name: 'October', mult: 1.20 },
  11: { name: 'November', mult: 1.18 },
  12: { name: 'December', mult: 1.00 }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originState = searchParams.get('originState')?.toUpperCase() || 'MAHARASHTRA';
    const destState = searchParams.get('destState')?.toUpperCase() || 'DELHI';
    const mode = (searchParams.get('mode') || 'road') as 'road' | 'air' | 'sea' | 'rail';
    const weightKg = Number(searchParams.get('weightKg') || 1000);
    const month = Number(searchParams.get('month') || 6); // default to June
    const commodity = searchParams.get('commodity')?.toLowerCase() || 'general';
    const commodityFactor = COMMODITY_FACTORS[commodity] || 1.0;

    // Get all won leads for the selected mode and commodity to train the regression
    const leads = getLeads();
    const wonLeads = leads.filter(l => l.status === 'Won' && l.mode === mode && l.commodity === commodity);

    let slope = 0;
    let intercept = 0;
    let standardError = 0;
    const N = wonLeads.length;

    // Default parameters by mode for fallback
    const DEFAULTS = {
      road: { slope: 4.5, intercept: 12000 },
      air: { slope: 75, intercept: 40000 },
      rail: { slope: 1.8, intercept: 8000 },
      sea: { slope: 2.5, intercept: 15000 }
    };

    if (N >= 3) {
      // Custom Ordinary Least Squares (OLS) Linear Regression: Cost = intercept + slope * weightKg
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      wonLeads.forEach(l => {
        const x = l.weightKg;
        const y = l.calculatedCost;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      const denominator = N * sumX2 - sumX * sumX;
      if (denominator !== 0) {
        slope = (N * sumXY - sumX * sumY) / denominator;
        intercept = (sumY - slope * sumX) / N;

        // Calculate standard error of the estimate
        let sumResidualSquared = 0;
        wonLeads.forEach(l => {
          const predicted = intercept + slope * l.weightKg;
          sumResidualSquared += Math.pow(l.calculatedCost - predicted, 2);
        });
        standardError = Math.sqrt(sumResidualSquared / (N - 2));
      } else {
        slope = DEFAULTS[mode].slope;
        intercept = DEFAULTS[mode].intercept;
        standardError = (intercept + slope * weightKg) * 0.08;
      }
    } else {
      // Fallback to default rate card averages if data is sparse
      slope = DEFAULTS[mode].slope;
      intercept = DEFAULTS[mode].intercept;
      standardError = (intercept + slope * weightKg) * 0.08;
    }

    // Adjust prediction based on specific origin-dest lane from rate card if available
    const forwarders = getForwarders();
    let laneMatched = false;
    let basePriceSum = 0;
    let pricePerKgSum = 0;
    let matchCount = 0;

    forwarders.forEach(f => {
      let rate = f.rateCard.find(r => r.originState === originState && r.destState === destState && r.mode === mode && r.commodity === commodity);
      if (!rate) {
        rate = f.rateCard.find(r => r.originState === originState && r.destState === destState && r.mode === mode && !r.commodity);
      }
      if (rate) {
        basePriceSum += rate.basePrice;
        pricePerKgSum += rate.pricePerKg;
        matchCount++;
      }
    });

    if (matchCount > 0) {
      // Overwrite slope and intercept with actual lane pricing from rate card
      const avgBase = basePriceSum / matchCount;
      const avgPerKg = pricePerKgSum / matchCount;
      // Add platform margin markup of 7%
      intercept = avgBase * 1.07;
      slope = avgPerKg * 1.07;
      laneMatched = true;
    }

    // 1. Calculate prediction with seasonality multiplier
    const selectedSeason = SEASONALITY[month] || { name: 'June', mult: 1.0 };
    const rawPrediction = intercept + slope * weightKg;
    const predictedPrice = Math.round(rawPrediction * selectedSeason.mult * commodityFactor);

    // 2. 95% Confidence Interval Bounds (t-score approx 1.96)
    const marginOfError = Math.round(1.96 * standardError * selectedSeason.mult);
    const confidenceLower = Math.max(0, predictedPrice - marginOfError);
    const confidenceUpper = predictedPrice + marginOfError;

    // 3. Best time to ship recommendation
    // Find the month with the lowest seasonality multiplier
    let bestMonth = 1;
    let minMult = 2.0;
    Object.entries(SEASONALITY).forEach(([mKey, data]) => {
      if (data.mult < minMult) {
        minMult = data.mult;
        bestMonth = Number(mKey);
      }
    });

    const bestSeason = SEASONALITY[bestMonth];
    const bestPrice = Math.round(rawPrediction * bestSeason.mult);
    const potentialSavings = Math.max(0, Math.round(((predictedPrice - bestPrice) / predictedPrice) * 100));

    // 4. Generate seasonal pricing projection for charts (12 months)
    const monthlyProjection = Object.entries(SEASONALITY).map(([, data]) => {
      const price = Math.round(rawPrediction * data.mult);
      return {
        month: data.name,
        rate: price,
        lower: Math.max(0, price - marginOfError),
        upper: price + marginOfError
      };
    });

    return NextResponse.json({
      success: true,
      prediction: {
        lane: `${originState} -> ${destState}`,
        mode,
        weightKg,
        commodity,
        commodityFactor,
        predictedPrice,
        confidenceLower,
        confidenceUpper,
        standardError: Math.round(standardError),
        laneMatched,
        monthName: selectedSeason.name,
        seasonMultiplier: selectedSeason.mult
      },
      recommendation: {
        bestMonth: bestSeason.name,
        bestPrice,
        potentialSavingsPercent: potentialSavings,
        message: potentialSavings > 0 
          ? `Shipping in ${bestSeason.name} could save you up to ${potentialSavings}% (₹${(predictedPrice - bestPrice).toLocaleString('en-IN')}) due to historical off-peak demand.`
          : `Current shipping rates for this lane are optimal. Seasonality is favorable.`
      },
      projection: monthlyProjection
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Server error';
    console.error('Predictive pricing error:', e);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
