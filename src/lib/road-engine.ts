import { getPincodeData } from './pincode-db';
import { getTollPlazasOnRoute, getTollRate } from './toll-engine';
import { QuoteInput, QuoteResult, VehicleType, CommodityFactor } from './types';

export const VEHICLE_TYPES: VehicleType[] = [
  { code: '16T', name: '16 Ton Truck (2 Axle)', maxWeightKg: 9000, baseRatePerKm: 28 },
  { code: '25T', name: '25 Ton Truck (3 Axle)', maxWeightKg: 16000, baseRatePerKm: 35 },
  { code: '40T', name: '40 Ton Trailer (4-6 Axle)', maxWeightKg: 40000, baseRatePerKm: 48 },
];

export const COMMODITY_FACTORS: CommodityFactor[] = [
  { code: 'general', name: 'General Cargo', factor: 1.00 },
  { code: 'auto-parts', name: 'Auto Parts', factor: 1.05 },
  { code: 'pharma', name: 'Pharma / Cold Chain', factor: 1.25 },
  { code: 'hazardous', name: 'Hazardous / DG', factor: 1.35 },
  { code: 'perishable', name: 'Perishable (F&V)', factor: 1.20 },
  { code: 'odc', name: 'Over-Dimensional', factor: 1.50 },
  { code: 'steel', name: 'Steel / Cement', factor: 0.95 },
  { code: 'textiles', name: 'Textiles', factor: 1.00 },
  { code: 'electronics', name: 'Electronics', factor: 1.15 },
  { code: 'chemicals', name: 'Chemicals', factor: 1.20 },
  { code: 'fmcg', name: 'FMCG', factor: 1.00 },
  { code: 'machinery', name: 'Machinery', factor: 1.10 },
  { code: 'furniture', name: 'Furniture', factor: 1.05 },
  { code: 'paper', name: 'Paper / Packaging', factor: 0.98 },
  { code: 'plastic', name: 'Plastic Granules', factor: 1.00 },
];

const FUEL_SURCHARGE_PCT = 0.18;
const DOCUMENTATION_FEE = 500;
const INSURANCE_RATE = 0.003;
const MIN_INSURANCE = 500;

const LAST_MILE_RATES: Record<string, { firstKg: number; addKg: number; min: number }> = {
  'A': { firstKg: 45, addKg: 15, min: 250 },
  'B': { firstKg: 55, addKg: 20, min: 300 },
  'C': { firstKg: 70, addKg: 25, min: 400 },
  'D': { firstKg: 90, addKg: 35, min: 500 },
  'E': { firstKg: 120, addKg: 50, min: 800 },
};

const ENTRY_TAX_RATES: Record<string, { fixed: number; pctOfFreight: number; max?: number }> = {
  'Maharashtra': { fixed: 0, pctOfFreight: 0.01, max: 5000 },
  'Gujarat': { fixed: 200, pctOfFreight: 0 },
  'Uttar Pradesh': { fixed: 150, pctOfFreight: 0.005 },
  'Delhi': { fixed: 0, pctOfFreight: 0 },
  'Rajasthan': { fixed: 100, pctOfFreight: 0 },
  'Madhya Pradesh': { fixed: 100, pctOfFreight: 0 },
  'Karnataka': { fixed: 150, pctOfFreight: 0 },
  'Tamil Nadu': { fixed: 100, pctOfFreight: 0 },
  'Telangana': { fixed: 100, pctOfFreight: 0 },
  'West Bengal': { fixed: 100, pctOfFreight: 0 },
  'Haryana': { fixed: 100, pctOfFreight: 0 },
};

async function fetchOSRMRoute(origin: { lat: number; lon: number }, dest: { lat: number; lon: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM routing failed');
  const data = await res.json();
  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationHrs: route.duration / 3600,
    geometry: route.geometry.coordinates.map((c: number[]) => ({ lat: c[1], lon: c[0] })),
  };
}

function selectVehicle(weightKg: number, preferredType?: '16T' | '25T' | '40T'): VehicleType {
  if (preferredType) {
    return VEHICLE_TYPES.find(v => v.code === preferredType) || VEHICLE_TYPES[0];
  }
  if (weightKg <= 9000) return VEHICLE_TYPES[0];
  if (weightKg <= 16000) return VEHICLE_TYPES[1];
  return VEHICLE_TYPES[2];
}

function calcLastMile(zone: string, weightKg: number): number {
  const rate = LAST_MILE_RATES[zone] || LAST_MILE_RATES['C'];
  const kg = Math.max(weightKg / 1000, 0.5);
  return rate.min + Math.max(0, kg - 1) * rate.addKg;
}

function calcEntryTax(destState: string, freightPlusTolls: number): number {
  const rule = ENTRY_TAX_RATES[destState] || { fixed: 0, pctOfFreight: 0 };
  return rule.fixed + freightPlusTolls * rule.pctOfFreight;
}

export async function calculateRoadFTL(input: QuoteInput): Promise<QuoteResult> {
  const origin = getPincodeData(input.originPincode);
  const dest = getPincodeData(input.destPincode);
  
  if (!origin || !dest) {
    throw new Error('Invalid pincode(s)');
  }

  const vehicle = selectVehicle(input.weightKg, input.vehicleType);
  const commodity = COMMODITY_FACTORS.find(c => c.code === input.commodity) || COMMODITY_FACTORS[0];
  
  const route = await fetchOSRMRoute(
    { lat: origin.lat, lon: origin.lon },
    { lat: dest.lat, lon: dest.lon }
  );

  const tollPlazas = getTollPlazasOnRoute(route.geometry);
  const totalToll = tollPlazas.reduce((sum, p) => sum + getTollRate(p.code, vehicle.code), 0);
  const tollPlazasWithAmount = tollPlazas.map(p => ({ 
    ...p, 
    tollAmount: getTollRate(p.code, vehicle.code) 
  }));

  const baseFreight = route.distanceKm * vehicle.baseRatePerKm;
  const fuelSurcharge = baseFreight * FUEL_SURCHARGE_PCT;
  const commodityAdjustment = baseFreight * (commodity.factor - 1);
  const pickupLastMile = calcLastMile(origin.deliveryZone, input.weightKg);
  const deliveryLastMile = calcLastMile(dest.deliveryZone, input.weightKg);
  const entryTax = calcEntryTax(dest.state, baseFreight + totalToll);
  const insurance = input.valueInr ? Math.max(MIN_INSURANCE, input.valueInr * INSURANCE_RATE) : 0;
  
  const total = baseFreight + fuelSurcharge + commodityAdjustment + totalToll + 
                pickupLastMile + deliveryLastMile + entryTax + insurance + DOCUMENTATION_FEE;
  
  const transitDays = Math.ceil(route.durationHrs / 8);

  return {
    mode: 'road',
    distanceKm: Math.round(route.distanceKm * 10) / 10,
    durationHrs: Math.round(route.durationHrs * 10) / 10,
    vehicle: vehicle.name,
    tollPlazas: tollPlazasWithAmount,
    breakdown: {
      baseFreight: Math.round(baseFreight),
      fuelSurcharge: Math.round(fuelSurcharge),
      commodityAdjustment: Math.round(commodityAdjustment),
      tolls: Math.round(totalToll),
      pickupLastMile: Math.round(pickupLastMile),
      deliveryLastMile: Math.round(deliveryLastMile),
      entryTax: Math.round(entryTax),
      insurance: Math.round(insurance),
      documentation: DOCUMENTATION_FEE,
    },
    total: Math.round(total),
    perKg: Math.round((total / input.weightKg) * 100) / 100,
    confidence: 0.97,
    transitDays,
    originName: `${origin.district}, ${origin.state}`,
    destName: `${dest.district}, ${dest.state}`,
  };
}