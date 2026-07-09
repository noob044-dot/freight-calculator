import { getPincodeData } from './pincode-db';
import { QuoteInput, QuoteResult } from './types';
import { COMMODITY_FACTORS } from './road-engine';

const PORTS: Record<string, { name: string; lat: number; lon: number }> = {
  JNPT: { name: 'Jawaharlal Nehru Port Trust (JNPT, Mumbai)', lat: 18.9500, lon: 72.9500 },
  MUNDRA: { name: 'Mundra Port (Gujarat)', lat: 22.7500, lon: 69.7000 },
  CHENNAI: { name: 'Chennai Port (Tamil Nadu)', lat: 13.1000, lon: 80.3000 },
  VIZAG: { name: 'Visakhapatnam Port (Andhra Pradesh)', lat: 17.6800, lon: 83.2200 },
  KOLKATA: { name: 'Kolkata Port (West Bengal)', lat: 22.4800, lon: 88.3100 },
  COCHIN: { name: 'Cochin Port (Kerala)', lat: 9.9700, lon: 76.2700 },
  MORMUGAO: { name: 'Mormugao Port (Goa)', lat: 15.4200, lon: 73.8000 },
  'NEW MANGALORE': { name: 'New Mangalore Port (Karnataka)', lat: 12.9300, lon: 74.8200 },
};

function getNearestPort(portName: string) {
  const name = (portName || 'JNPT').toUpperCase().trim();
  if (PORTS[name]) {
    return { code: name, ...PORTS[name] };
  }
  // Try to find if part of the name matches
  for (const key of Object.keys(PORTS)) {
    if (name.includes(key) || key.includes(name)) {
      return { code: key, ...PORTS[key] };
    }
  }
  return {
    code: 'JNPT',
    name: 'Jawaharlal Nehru Port Trust (JNPT, Mumbai)',
    lat: PORTS.JNPT.lat,
    lon: PORTS.JNPT.lon,
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

const CONTAINER_RATES = {
  '20ft_GP': { base: 12000, perKm: 8, thc: 7500, label: '20ft General Purpose' },
  '40ft_GP': { base: 20000, perKm: 12, thc: 11500, label: '40ft General Purpose' },
  '40ft_HC': { base: 22000, perKm: 14, thc: 11500, label: '40ft High Cube' },
  '20ft_RF': { base: 30000, perKm: 18, thc: 9500, label: '20ft Reefer' },
  '40ft_RF': { base: 50000, perKm: 26, thc: 14500, label: '40ft Reefer' },
};

export async function calculateSea(input: QuoteInput): Promise<QuoteResult> {
  const origin = getPincodeData(input.originPincode);
  const dest = getPincodeData(input.destPincode);

  if (!origin || !dest) {
    throw new Error('Invalid pincode(s)');
  }

  const originPort = getNearestPort(origin.nearestPort);
  const destPort = getNearestPort(dest.nearestPort);

  const seaDistance = haversineDistance(
    { lat: originPort.lat, lon: originPort.lon },
    { lat: destPort.lat, lon: destPort.lon }
  );

  // Auto select container type if not preferred
  let cType = input.containerType || '20ft_GP';
  if (!input.containerType) {
    if (input.commodity === 'pharma' || input.commodity === 'perishable') {
      cType = input.weightKg <= 18000 ? '20ft_RF' : '40ft_RF';
    } else {
      cType = input.weightKg <= 18000 ? '20ft_GP' : '40ft_GP';
    }
  }

  const cRate = CONTAINER_RATES[cType] || CONTAINER_RATES['20ft_GP'];

  // Ocean Freight Cost
  const baseFreight = cRate.base + seaDistance * cRate.perKm;
  const fuelSurcharge = baseFreight * 0.12; // BAF: 12%

  const commodity = COMMODITY_FACTORS.find(c => c.code === input.commodity) || COMMODITY_FACTORS[0];
  const commodityAdjustment = baseFreight * (commodity.factor - 1);

  // Road feeder legs
  const firstMileDist = haversineDistance({ lat: origin.lat, lon: origin.lon }, { lat: originPort.lat, lon: originPort.lon });
  const lastMileDist = haversineDistance({ lat: dest.lat, lon: dest.lon }, { lat: destPort.lat, lon: destPort.lon });

  // Ex Works (EXW), FOB, CIF/CFR adjustments
  const incoterm = input.incoterm || 'EXW';

  let pickupLastMile = 0;
  if (incoterm === 'EXW' || incoterm === 'CIF' || incoterm === 'CFR') {
    pickupLastMile = calcLastMile(origin.deliveryZone, input.weightKg) + firstMileDist * 18;
  }

  let deliveryLastMile = 0;
  if (incoterm === 'EXW' || incoterm === 'FOB') {
    deliveryLastMile = calcLastMile(dest.deliveryZone, input.weightKg) + lastMileDist * 18;
  }

  const entryTax = incoterm === 'EXW' || incoterm === 'FOB'
    ? (dest.state === 'Maharashtra' ? Math.min(5000, baseFreight * 0.01) : 250)
    : 0;

  const insurance = input.valueInr ? Math.max(500, input.valueInr * 0.003) : 0;
  const documentation = 8000 + cRate.thc; // Port THC + documentation & custom clearance charges (₹8,000)

  const total = baseFreight + fuelSurcharge + commodityAdjustment + pickupLastMile + deliveryLastMile + entryTax + insurance + documentation;
  const transitDays = Math.ceil((seaDistance / 400) + 5); // Sea vessel speed is slow + port handling buffer (5 days)

  return {
    mode: 'sea',
    distanceKm: Math.round(seaDistance * 10) / 10,
    durationHrs: Math.round((seaDistance / 35 + 120) * 10) / 10, // ~35 km/hr speed + 5 days port buffers
    vehicle: `Sea FCL - ${cRate.label} (${originPort.code} to ${destPort.code}) - Incoterm: ${incoterm}`,
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
    confidence: 0.93,
    transitDays,
    originName: `${origin.district}, ${origin.state}`,
    destName: `${dest.district}, ${dest.state}`,
  };
}
