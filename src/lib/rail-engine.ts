import { getPincodeData } from './pincode-db';
import { QuoteInput, QuoteResult } from './types';
import { COMMODITY_FACTORS } from './road-engine';

const ICDS: Record<string, { name: string; lat: number; lon: number }> = {
  TUGHLAKABAD: { name: 'ICD Tughlakabad (Delhi)', lat: 28.5000, lon: 77.2900 },
  SANATHNAGAR: { name: 'ICD Sanathnagar (Hyderabad)', lat: 17.4500, lon: 78.4300 },
  DADRI: { name: 'ICD Dadri (Greater Noida)', lat: 28.5600, lon: 77.5500 },
  WHITEFIELD: { name: 'ICD Whitefield (Bangalore)', lat: 12.9700, lon: 77.7500 },
  LUDHIANA: { name: 'ICD Dhandhari Kalan (Ludhiana)', lat: 30.8800, lon: 75.9200 },
  AHMEDABAD: { name: 'ICD Khodiyar (Ahmedabad)', lat: 23.1600, lon: 72.5800 },
  NAGPUR: { name: 'ICD Nagpur (Maharashtra)', lat: 21.1500, lon: 79.0800 },
  KANPUR: { name: 'ICD Kanpur (Uttar Pradesh)', lat: 26.4500, lon: 80.3300 },
  KOLKATA: { name: 'ICD Kolkata (West Bengal)', lat: 22.4800, lon: 88.3100 },
  MUMBAI: { name: 'ICD Mulund (Mumbai)', lat: 19.1667, lon: 72.9500 },
};

function getNearestICD(icdName: string) {
  const name = (icdName || 'TUGHLAKABAD').toUpperCase().trim();
  if (ICDS[name]) {
    return { code: name, ...ICDS[name] };
  }
  // Try partial match
  for (const key of Object.keys(ICDS)) {
    if (name.includes(key) || key.includes(name)) {
      return { code: key, ...ICDS[key] };
    }
  }
  return {
    code: 'TUGHLAKABAD',
    name: 'ICD Tughlakabad (Delhi)',
    lat: ICDS.TUGHLAKABAD.lat,
    lon: ICDS.TUGHLAKABAD.lon,
  };
}

function haversineDistance(c1: { lat: number; lon: number }, c2: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lon - c1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const LAST_MILE_RATES: Record<string, { firstKg: number; addKg: number; min: number }> = {
  'A': { firstKg: 45, addKg: 15, min: 250 },
  'B': { firstKg: 55, addKg: 20, min: 300 },
  'C': { firstKg: 70, addKg: 25, min: 400 },
  'D': { firstKg: 90, addKg: 35, min: 500 },
  'E': { firstKg: 120, addKg: 50, min: 800 },
};

function calcLastMile(zone: string, weightKg: number): number {
  const rate = LAST_MILE_RATES[zone] || LAST_MILE_RATES['C'];
  const kg = Math.max(weightKg / 1000, 0.5);
  return rate.min + Math.max(0, kg - 1) * rate.addKg;
}

export async function calculateRail(input: QuoteInput): Promise<QuoteResult> {
  const origin = getPincodeData(input.originPincode);
  const dest = getPincodeData(input.destPincode);

  if (!origin || !dest) {
    throw new Error('Invalid pincode(s)');
  }

  const originICD = getNearestICD(origin.nearestICD);
  const destICD = getNearestICD(dest.nearestICD);

  const railDistance = haversineDistance(
    { lat: originICD.lat, lon: originICD.lon },
    { lat: destICD.lat, lon: destICD.lon }
  );

  // Rake & Wagon Selection
  let wagonType = 'BCN Covered Wagon';
  let tonRate = 2.5; // rate in ₹/ton-km
  
  if (input.commodity === 'steel' || input.commodity === 'machinery' || input.commodity === 'odc') {
    wagonType = 'BOXN Open Wagon';
    tonRate = 2.1;
  } else if (input.commodity === 'chemicals' || input.commodity === 'hazardous') {
    wagonType = 'BTPN Tanker Wagon';
    tonRate = 2.9;
  }

  const weightTons = Math.max(input.weightKg / 1000, 1.0); // min 1 ton
  const baseFreight = railDistance * weightTons * tonRate;
  const fuelSurcharge = baseFreight * 0.18; // Fuel adjustment charge: 18%

  const commodity = COMMODITY_FACTORS.find(c => c.code === input.commodity) || COMMODITY_FACTORS[0];
  const commodityAdjustment = baseFreight * (commodity.factor - 1);

  // First & Last mile road transport distance from pincodes to terminals
  const firstMileDist = haversineDistance({ lat: origin.lat, lon: origin.lon }, { lat: originICD.lat, lon: originICD.lon });
  const lastMileDist = haversineDistance({ lat: dest.lat, lon: dest.lon }, { lat: destICD.lat, lon: destICD.lon });

  // Feeder cost calculation (Road FTL per km rate of ~₹20/km + zone min)
  const pickupLastMile = calcLastMile(origin.deliveryZone, input.weightKg) + firstMileDist * 20;
  const deliveryLastMile = calcLastMile(dest.deliveryZone, input.weightKg) + lastMileDist * 20;

  const entryTax = dest.state === 'Maharashtra' ? Math.min(5000, baseFreight * 0.01) : 200;
  const insurance = input.valueInr ? Math.max(500, input.valueInr * 0.003) : 0;
  const documentation = 4500; // IRCTC depot charges + documentation

  const total = baseFreight + fuelSurcharge + commodityAdjustment + pickupLastMile + deliveryLastMile + entryTax + insurance + documentation;
  const transitDays = Math.ceil((railDistance / 350) + 2); // 350 km/day + loading buffers (2 days)

  return {
    mode: 'rail',
    distanceKm: Math.round(railDistance * 10) / 10,
    durationHrs: Math.round((railDistance / 40 + 48) * 10) / 10, // ~40 km/hr average + loading/unloading buffer (48 hrs)
    vehicle: `Indian Railways - ${wagonType} (${originICD.code} to ${destICD.code})`,
    breakdown: {
      baseFreight: Math.round(baseFreight),
      fuelSurcharge: Math.round(fuelSurcharge),
      commodityAdjustment: Math.round(commodityAdjustment),
      tolls: 0,
      pickupLastMile: Math.round(pickupLastMile),
      deliveryLastMile: Math.round(deliveryLastMile),
      entryTax: Math.round(entryTax),
      insurance: Math.round(insurance),
      documentation,
    },
    total: Math.round(total),
    perKg: Math.round((total / input.weightKg) * 100) / 100,
    confidence: 0.94,
    transitDays,
    originName: `${origin.district}, ${origin.state}`,
    destName: `${dest.district}, ${dest.state}`,
  };
}
