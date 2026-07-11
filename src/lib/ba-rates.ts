import pincodeRates from '../../data/benchmarks/ba_pincode_rates.json';
import regionMatrix from '../../data/benchmarks/ba_region_matrix.json';
import spiceRates from '../../data/benchmarks/spicexpress_console_rates.json';
import indigoRates from '../../data/benchmarks/indigo_console_rates.json';
import bomBlrRates from '../../data/benchmarks/bom_blr_detailed.json';

export interface BARateRecord {
  pincode: string;
  mapping_code: string;
  taluk: string;
  district: string;
  state: string;
  zone: string;
  oda: string;
  airport: string;
  provider: string;
  base_rate: number;
}

export interface RegionRateRecord {
  origin_region: string;
  dest_region: string;
  rate_per_kg: number;
}

export interface ConsoleRateRecord {
  origin: string;
  dest: string;
  flight: string;
  time_slab: string;
  consol: string;
  airline_rate: number | null;
  flat_rate: number | null;
  misc_charges: number;
  outgoing_charges: number;
  retrieval_charges: number;
  surcharge: number;
  net_rate: number | null;
}

export interface BOMBLRRecord {
  origin: string;
  dest: string;
  flight: string;
  product: string;
  weight_kg: number;
  per_kg_rate: number | null;
  basic_freight: number;
  de_utilization: number;
  fsc: number;
  ssc: number;
  awb_fee: number;
  do_fee: number;
  coms: number;
  xray_certification: number;
  utilization: number;
  xray: number;
  subtotal: number;
  gst: number;
  total: number;
  per_kg_total: number;
}

// ── BA Pincode Rate Lookup ──────────────────────────────────────────
const pincodeMap = new Map<string, BARateRecord>();
(pincodeRates as BARateRecord[]).forEach(r => pincodeMap.set(r.pincode, r));

export function getBARate(pincode: string): { baseRate: number; airport: string; provider: string } | null {
  const r = pincodeMap.get(pincode);
  if (!r) return null;
  return { baseRate: r.base_rate, airport: r.airport, provider: r.provider };
}

export function getBARateByPin(pincode: string): BARateRecord | null {
  return pincodeMap.get(pincode) || null;
}

// ── Region Matrix Lookup ────────────────────────────────────────────
const regionKey = (o: string, d: string) => `${o}->${d}`;
const regionMap = new Map<string, number>();
(regionMatrix as RegionRateRecord[]).forEach(r => regionMap.set(regionKey(r.origin_region, r.dest_region), r.rate_per_kg));

export function getBARegionRate(originRegion: string, destRegion: string): number | null {
  return regionMap.get(regionKey(originRegion, destRegion)) || null;
}

// ── SpiceXpress Console Rate Lookup ─────────────────────────────────
export function getSpiceXpressRate(origin: string, dest: string, weightKg: number): { netRate: number; flight: string } | null {
  if (weightKg < 0) return null;
  const lane = (spiceRates as ConsoleRateRecord[]).filter(r =>
    r.origin === origin.toUpperCase() && r.dest === dest.toUpperCase() && r.net_rate != null
  );
  if (lane.length === 0) return null;
  const best = lane.reduce((a, b) => (a.net_rate! < b.net_rate! ? a : b));
  return { netRate: best.net_rate!, flight: best.flight.trim() };
}

// ── IndiGo Console Rate Lookup ──────────────────────────────────────
export function getIndiGoRate(origin: string, dest: string, weightKg: number): { netRate: number; flight: string } | null {
  if (weightKg < 0) return null;
  const lane = (indigoRates as ConsoleRateRecord[]).filter(r =>
    r.origin === origin.toUpperCase() && r.dest === dest.toUpperCase() && r.net_rate != null
  );
  if (lane.length === 0) return null;
  const best = lane.reduce((a, b) => (a.net_rate! < b.net_rate! ? a : b));
  return { netRate: best.net_rate!, flight: best.flight.trim() };
}

// ── BOM→BLR Weight-Break Rate Lookup ───────────────────────────────
const bomBlrSorted = (bomBlrRates as BOMBLRRecord[]).sort((a, b) => a.weight_kg - b.weight_kg);

export function getBOMBLRRate(weightKg: number): { perKg: number; total: number; flight: string } | null {
  if (bomBlrSorted.length === 0) return null;
  let match = bomBlrSorted[0];
  for (const r of bomBlrSorted) {
    if (weightKg >= r.weight_kg) match = r;
  }
  if (!match.per_kg_rate) return null;
  return { perKg: match.per_kg_rate, total: match.total, flight: match.flight.trim() };
}

// ── Bulk: get all unique pincodes that have BA rates ────────────────
export function getAllRatedPincodes(): string[] {
  return Array.from(pincodeMap.keys());
}

// ── Airport code from pincode ──────────────────────────────────────
export function getAirportFromPincode(pincode: string): string | null {
  const r = pincodeMap.get(pincode);
  return r ? r.airport : null;
}
