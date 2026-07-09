import { TollPlaza } from './toll-engine';

export interface VehicleType {
  code: '16T' | '25T' | '40T';
  name: string;
  maxWeightKg: number;
  baseRatePerKm: number;
}

export interface CommodityFactor {
  code: string;
  name: string;
  factor: number;
}

export interface QuoteInput {
  originPincode: string;
  destPincode: string;
  weightKg: number;
  commodity: string;
  vehicleType?: '16T' | '25T' | '40T';
  valueInr?: number;
  dimensions?: { length: number; width: number; height: number };
  containerType?: '20ft_GP' | '40ft_GP' | '40ft_HC' | '20ft_RF' | '40ft_RF';
  incoterm?: 'FOB' | 'CIF' | 'CFR' | 'EXW';
}

export interface QuoteBreakdown {
  baseFreight: number;
  fuelSurcharge: number;
  commodityAdjustment: number;
  tolls: number;
  pickupLastMile: number;
  deliveryLastMile: number;
  entryTax: number;
  insurance: number;
  documentation: number;
}

export interface QuoteResult {
  mode: 'road' | 'air' | 'sea' | 'rail';
  distanceKm: number;
  durationHrs: number;
  vehicle: string;
  tollPlazas?: (TollPlaza & { tollAmount: number })[];
  breakdown: QuoteBreakdown;
  total: number;
  perKg: number;
  confidence: number;
  transitDays: number;
  originName: string;
  destName: string;
}

export interface Benchmark {
  freightosIndex: number;
  cogoport: number;
  freightwalla: number;
  delex: number;
  average: number;
  savingsVsAverage: number;
}
