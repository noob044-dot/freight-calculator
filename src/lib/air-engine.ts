import { getPincodeData } from './pincode-db';
import { QuoteInput, QuoteResult } from './types';
import { COMMODITY_FACTORS } from './road-engine';
import { getBARate, getSpiceXpressRate, getIndiGoRate, getBOMBLRRate } from './ba-rates';

const AIRPORTS: Record<string, { name: string; lat: number; lon: number }> = {
  BOM: { name: 'Chhatrapati Shivaji Maharaj International Airport (Mumbai)', lat: 19.0886, lon: 72.8680 },
  DEL: { name: 'Indira Gandhi International Airport (Delhi)', lat: 28.5686, lon: 77.1122 },
  BLR: { name: 'Kempegowda International Airport (Bangalore)', lat: 13.2008, lon: 77.7088 },
  MAA: { name: 'Chennai International Airport (Chennai)', lat: 12.9816, lon: 80.1638 },
  CCU: { name: 'Netaji Subhash Chandra Bose International Airport (Kolkata)', lat: 22.6547, lon: 88.4467 },
  HYD: { name: 'Rajiv Gandhi International Airport (Hyderabad)', lat: 17.2312, lon: 78.4310 },
  AMD: { name: 'Sardar Vallabhbhai Patel International Airport (Ahmedabad)', lat: 23.0734, lon: 72.6347 },
  COK: { name: 'Cochin International Airport (Cochin)', lat: 10.1520, lon: 76.4019 },
  GOI: { name: 'Goa International Airport (Goa)', lat: 15.3797, lon: 73.8318 },
  IXC: { name: 'Chandigarh International Airport (Chandigarh)', lat: 30.6733, lon: 76.7885 },
};

function getNearestAirport(airportCode: string) {
  const code = (airportCode || 'DEL').toUpperCase().trim();
  if (AIRPORTS[code]) {
    return { code, ...AIRPORTS[code] };
  }
  // If not in major list, return DEL as fallback but use pincode coordinates
  return {
    code: 'DEL',
    name: 'Indira Gandhi International Airport (Delhi)',
    lat: AIRPORTS.DEL.lat,
    lon: AIRPORTS.DEL.lon,
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

export async function calculateAir(input: QuoteInput): Promise<QuoteResult> {
  const origin = getPincodeData(input.originPincode);
  const dest = getPincodeData(input.destPincode);

  if (!origin || !dest) {
    throw new Error('Invalid pincode(s)');
  }

  const originAirport = getNearestAirport(origin.nearestAirport);
  const destAirport = getNearestAirport(dest.nearestAirport);

  const airDistance = haversineDistance(
    { lat: originAirport.lat, lon: originAirport.lon },
    { lat: destAirport.lat, lon: destAirport.lon }
  );

  // Volumetric weight: max(actual, volume_cbm * 167)
  const volumeCbm = input.dimensions
    ? input.dimensions.length * input.dimensions.width * input.dimensions.height
    : 0;
  const chargeableWeight = Math.max(input.weightKg, volumeCbm * 167);

  // Air rates
  const baseRatePerKg = 45 + airDistance * 0.04; // e.g. BOM to DEL ~1150km -> ~₹91/kg
  const baseFreight = chargeableWeight * baseRatePerKg;
  const fuelSurcharge = baseFreight * 0.22; // 22% fuel surcharge

  const commodity = COMMODITY_FACTORS.find(c => c.code === input.commodity) || COMMODITY_FACTORS[0];
  const commodityAdjustment = baseFreight * (commodity.factor - 1);

  // First & Last mile road transport distance from pincodes to nearest airports
  const firstMileDist = haversineDistance({ lat: origin.lat, lon: origin.lon }, { lat: originAirport.lat, lon: originAirport.lon });
  const lastMileDist = haversineDistance({ lat: dest.lat, lon: dest.lon }, { lat: destAirport.lat, lon: destAirport.lon });

  // Road pickup/delivery cost based on zone + airport distance (₹15/km for feeder leg)
  const pickupLastMile = calcLastMile(origin.deliveryZone, input.weightKg) + firstMileDist * 15;
  const deliveryLastMile = calcLastMile(dest.deliveryZone, input.weightKg) + lastMileDist * 15;

  const entryTax = dest.state === 'Maharashtra' ? Math.min(5000, baseFreight * 0.01) : 150;
  const insurance = input.valueInr ? Math.max(500, input.valueInr * 0.003) : 0;
  const documentation = 1500; // Handling, security, customs and paperwork

  const total = baseFreight + fuelSurcharge + commodityAdjustment + pickupLastMile + deliveryLastMile + entryTax + insurance + documentation;
  const transitDays = Math.ceil((airDistance / 800) + 1); // 1-2 days normally

  // ── BA Competitor Benchmark Lookups ────────────────────────────────
  const baRate = getBARate(input.originPincode);
  const destAirportCode = dest.nearestAirport?.toUpperCase() || '';
  const originAirportCode = origin.nearestAirport?.toUpperCase() || '';
  const spiceRate = getSpiceXpressRate(originAirportCode, destAirportCode, input.weightKg);
  const indigoRate = getIndiGoRate(originAirportCode, destAirportCode, input.weightKg);
  const blrRate = originAirportCode === 'BOM' && destAirportCode === 'BLR'
    ? getBOMBLRRate(input.weightKg)
    : null;

  return {
    mode: 'air',
    distanceKm: Math.round(airDistance * 10) / 10,
    durationHrs: Math.round((airDistance / 700 + 4) * 10) / 10, // flight + ground handling time (4 hrs)
    vehicle: `Air Cargo - Standard (${originAirport.code} to ${destAirport.code})`,
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
    confidence: 0.95,
    transitDays,
    originName: `${origin.district}, ${origin.state}`,
    destName: `${dest.district}, ${dest.state}`,
    benchmarks: {
      blueDartBA: baRate,
      spiceXpress: spiceRate,
      indiGo: indigoRate,
      bomBlrSpecial: blrRate,
    },
  };
}
