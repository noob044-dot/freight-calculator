import { Forwarder, getForwarders } from './db';

interface ScoringResult {
  score: number;
  urgency: 'high' | 'medium' | 'low';
  isHot: boolean;
  leadCost: number;
}

/**
 * Calculates lead score, urgency, and the hot/cold billing status.
 * Hot lead (₹1000 billing fee): Monthly tonnage > 50 Tons
 * Cold lead (₹500 billing fee): Monthly tonnage <= 50 Tons
 */
export function scoreLead(
  weightKg: number,
  monthlyVolume: string, // '1-5' | '5-20' | '20-50' | '50+'
  mode: 'road' | 'air' | 'sea' | 'rail'
): ScoringResult {
  // 1. Calculate Monthly Tonnage
  let shipmentsPerMonth = 3;
  if (monthlyVolume === '5-20') shipmentsPerMonth = 12;
  if (monthlyVolume === '20-50') shipmentsPerMonth = 35;
  if (monthlyVolume === '50+') shipmentsPerMonth = 60;

  const weightTons = weightKg / 1000;
  const monthlyTonnage = weightTons * shipmentsPerMonth;

  // 2. Binary Hot/Cold Threshold
  const isHot = monthlyTonnage > 50 || monthlyVolume === '50+';
  const leadCost = isHot ? 1000 : 500;

  // 3. Score calculation (0 - 100)
  let volumeScore = 20;
  if (monthlyVolume === '5-20') volumeScore = 40;
  if (monthlyVolume === '20-50') volumeScore = 70;
  if (monthlyVolume === '50+') volumeScore = 80;

  let weightScore = 5;
  if (weightKg >= 5000) {
    weightScore = 20;
  } else if (weightKg >= 1000) {
    weightScore = 15;
  }

  const score = volumeScore + weightScore;

  // 4. Urgency mapping
  let urgency: 'high' | 'medium' | 'low' = 'medium';
  if ((mode === 'air' || mode === 'road') && (monthlyVolume === '20+' || monthlyVolume === '6-20')) {
    urgency = 'high';
  } else if ((mode === 'sea' || mode === 'rail') && monthlyVolume === '1-5') {
    urgency = 'low';
  }

  return {
    score,
    urgency,
    isHot,
    leadCost
  };
}

/**
 * Finds all forwarders that cover either the origin or destination state
 * and support the specified transportation mode.
 */
export function findMatchingForwarders(
  originState: string,
  destState: string,
  mode: 'road' | 'air' | 'sea' | 'rail'
): Forwarder[] {
  const allForwarders = getForwarders();
  const originUpper = (originState || '').toUpperCase().trim();
  const destUpper = (destState || '').toUpperCase().trim();

  return allForwarders.filter((fwd) => {
    // Check mode compatibility
    const supportsMode = fwd.supportedModes.includes(mode);
    if (!supportsMode) return false;

    // Check lane coverage (covers either origin or destination state)
    const coversOrigin = fwd.coveredLanes.some((state) => state.toUpperCase() === originUpper);
    const coversDest = fwd.coveredLanes.some((state) => state.toUpperCase() === destUpper);

    return coversOrigin || coversDest;
  });
}
