import fs from 'fs';
import path from 'path';

// Define the Types for Marketplace Entities

export interface Bid {
  forwarderId: string;
  forwarderName: string;
  amount: number;
  transitDays: number;
  submittedAt: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  remarks?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  monthlyVolume: string; // '1-5' | '6-20' | '20+'
  originPincode: string;
  destPincode: string;
  originState: string;
  destState: string;
  weightKg: number;
  commodity: string;
  mode: 'road' | 'air' | 'sea' | 'rail';
  calculatedCost: number;
  score: number;
  urgency: 'high' | 'medium' | 'low';
  isHot: boolean;
  leadCost: number; // 500 or 1000
  createdAt: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost';
  assignedForwarderId: string | null;
  bids: Bid[];
}

export interface ForwarderRate {
  originState: string;
  destState: string;
  mode: 'road' | 'air' | 'sea' | 'rail';
  basePrice: number;
  pricePerKg: number;
  commodity?: string;
}

export interface Forwarder {
  id: string;
  name: string;
  gstin: string;
  rating: number;
  responseSlaMins: number;
  winRate: number;
  coveredLanes: string[]; // States covered
  supportedModes: ('road' | 'air' | 'sea' | 'rail')[];
  rateCard: ForwarderRate[];
}

export interface Invoice {
  id: string;
  forwarderId: string;
  forwarderName: string;
  month: string; // e.g. "July 2026"
  leadsCount: number;
  subtotal: number;
  cgst: number; // 9%
  sgst: number; // 9%
  total: number;
  status: 'Paid' | 'Unpaid';
  createdAt: string;
  paidAt?: string;
}

// File Path Configuration
const DATA_DIR = path.join(process.cwd(), 'src/lib/data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const FORWARDERS_FILE = path.join(DATA_DIR, 'forwarders.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');

// Ensure Data Directory Exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed Mock Forwarders if File Doesn't Exist
const MOCK_FORWARDERS: Forwarder[] = [
  {
    id: 'fwd-safexpress',
    name: 'Safexpress Logistics',
    gstin: '27AAFCS4123K1Z1',
    rating: 4.8,
    responseSlaMins: 24,
    winRate: 75,
    coveredLanes: ['MAHARASHTRA', 'GUJARAT', 'DELHI', 'KARNATAKA', 'TAMIL NADU'],
    supportedModes: ['road', 'rail'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'road', basePrice: 15000, pricePerKg: 4.5 },
      { originState: 'MAHARASHTRA', destState: 'GUJARAT', mode: 'road', basePrice: 6000, pricePerKg: 2.2 },
      { originState: 'GUJARAT', destState: 'DELHI', mode: 'road', basePrice: 10000, pricePerKg: 3.8 },
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'rail', basePrice: 8000, pricePerKg: 1.8 }
    ]
  },
  {
    id: 'fwd-bluedart',
    name: 'Blue Dart Cargo',
    gstin: '27AABCB8192A2Z5',
    rating: 4.9,
    responseSlaMins: 12,
    winRate: 82,
    coveredLanes: ['DELHI', 'MAHARASHTRA', 'KARNATAKA', 'TAMIL NADU', 'HARYANA', 'GUJARAT'],
    supportedModes: ['air', 'road'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'air', basePrice: 50000, pricePerKg: 85 },
      { originState: 'MAHARASHTRA', destState: 'KARNATAKA', mode: 'air', basePrice: 30000, pricePerKg: 65 },
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'road', basePrice: 18000, pricePerKg: 5.2 }
    ]
  },
  {
    id: 'fwd-concor',
    name: 'Container Corp of India (CONCOR)',
    gstin: '07AAACC3912J1Z0',
    rating: 4.5,
    responseSlaMins: 48,
    winRate: 68,
    coveredLanes: ['GUJARAT', 'MAHARASHTRA', 'DELHI', 'TAMIL NADU', 'WEST BENGAL', 'KARNATAKA'],
    supportedModes: ['sea', 'rail'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'rail', basePrice: 9000, pricePerKg: 1.6 },
      { originState: 'GUJARAT', destState: 'MAHARASHTRA', mode: 'sea', basePrice: 15000, pricePerKg: 2.5 },
      { originState: 'MAHARASHTRA', destState: 'TAMIL NADU', mode: 'sea', basePrice: 22000, pricePerKg: 3.1 }
    ]
  }
];

if (!fs.existsSync(FORWARDERS_FILE)) {
  fs.writeFileSync(FORWARDERS_FILE, JSON.stringify(MOCK_FORWARDERS, null, 2), 'utf-8');
}

function seedLeads(): Lead[] {
  const states = [
    { name: 'MAHARASHTRA', pin: '400001' },
    { name: 'DELHI', pin: '110001' },
    { name: 'GUJARAT', pin: '380001' },
    { name: 'KARNATAKA', pin: '560001' },
    { name: 'TAMIL NADU', pin: '600001' },
    { name: 'WEST BENGAL', pin: '700001' }
  ];
  
  const modes: ('road' | 'air' | 'sea' | 'rail')[] = ['road', 'air', 'rail', 'sea'];
  const commodities = ['general', 'perishable', 'hazardous', 'express'];
  const volumeOptions = ['1-5', '6-20', '20+', '50+'];

  const leads: Lead[] = [];
  const forwarders = getForwarders();

  for (let i = 1; i <= 60; i++) {
    const monthIndex = Math.floor((i - 1) / 10) + 1; // Months 1 to 6 (Jan to Jun)
    const day = ((i * 7) % 28) + 1;
    const dateStr = `2026-0${monthIndex}-${day < 10 ? '0' + day : day}T10:00:00.000Z`;

    const originIdx = (i % states.length);
    let destIdx = ((i + 2) % states.length);
    if (originIdx === destIdx) {
      destIdx = (destIdx + 1) % states.length;
    }
    const origin = states[originIdx];
    const dest = states[destIdx];

    let mode = modes[i % modes.length];
    const portStates = ['MAHARASHTRA', 'GUJARAT', 'TAMIL NADU', 'WEST BENGAL'];
    if (mode === 'sea' && (!portStates.includes(origin.name) || !portStates.includes(dest.name))) {
      mode = 'road';
    }

    const commodity = commodities[i % commodities.length];
    const volume = volumeOptions[i % volumeOptions.length];
    const weightKg = Math.floor(100 + (i * 380) % 19000); // 100 to 19100 kg

    const volumeScore = volume === '1-5' ? 20 : volume === '6-20' ? 50 : volume === '20+' ? 80 : 100;
    const weightScore = Math.min(100, Math.floor((weightKg / 20000) * 100));
    const score = Math.floor((volumeScore * 0.6) + (weightScore * 0.4));
    
    const shipmentsPerMonth = volume === '1-5' ? 3 : volume === '6-20' ? 12 : volume === '20+' ? 30 : 60;
    const monthlyTonnage = (weightKg / 1000) * shipmentsPerMonth;
    const isHot = monthlyTonnage > 50;
    const leadCost = isHot ? 1000 : 500;
    const urgency = score > 75 ? 'high' : score > 45 ? 'medium' : 'low';

    let minRate = 8000 + (weightKg * 4);
    let matches: { fwdId: string; name: string; amount: number }[] = [];

    forwarders.forEach(fwd => {
      if (!fwd.supportedModes.includes(mode)) return;
      if (!fwd.coveredLanes.includes(origin.name) || !fwd.coveredLanes.includes(dest.name)) return;

      const rate = fwd.rateCard.find(r => r.originState === origin.name && r.destState === dest.name && r.mode === mode);
      let fwdCost = 0;
      if (rate) {
        fwdCost = rate.basePrice + (weightKg * rate.pricePerKg);
      } else {
        const baseModePrice = mode === 'air' ? 40000 : mode === 'sea' ? 12000 : mode === 'rail' ? 9000 : 15000;
        const perKg = mode === 'air' ? 70 : mode === 'sea' ? 2.5 : mode === 'rail' ? 1.7 : 4.5;
        fwdCost = baseModePrice + (weightKg * perKg);
      }

      fwdCost = Math.round(fwdCost * (0.97 + (i % 7) * 0.01));
      matches.push({ fwdId: fwd.id, name: fwd.name, amount: fwdCost });
    });

    if (matches.length === 0) {
      const baseModePrice = mode === 'air' ? 45000 : mode === 'sea' ? 14000 : mode === 'rail' ? 10000 : 16000;
      const perKg = mode === 'air' ? 75 : mode === 'sea' ? 2.8 : mode === 'rail' ? 1.9 : 4.8;
      minRate = baseModePrice + (weightKg * perKg);
      
      matches = [
        { fwdId: 'fwd-safexpress', name: 'Safexpress Logistics', amount: Math.round(minRate * 0.98) },
        { fwdId: 'fwd-bluedart', name: 'Blue Dart Cargo', amount: Math.round(minRate * 1.02) }
      ];
    } else {
      minRate = Math.min(...matches.map(m => m.amount));
    }

    const platformCommissionRate = 0.05 + ((i % 4) * 0.01);
    const platformMargin = Math.round(minRate * platformCommissionRate);
    const calculatedCost = minRate + platformMargin;

    let status: 'New' | 'Contacted' | 'Quoted' | 'Won' | 'Lost' = 'Won';
    if (monthIndex === 6 && (i % 10 === 0 || i % 10 === 1)) {
      status = 'New';
    } else if (monthIndex === 6 && i % 10 === 2) {
      status = 'Quoted';
    } else if (i % 7 === 0) {
      status = 'Lost';
    }

    let assignedForwarderId: string | null = null;
    const bids: Bid[] = [];

    matches.forEach((m) => {
      const isWinner = status === 'Won' && m.amount === minRate;
      if (isWinner) {
        assignedForwarderId = m.fwdId;
      }

      bids.push({
        forwarderId: m.fwdId,
        forwarderName: m.name,
        amount: m.amount,
        transitDays: mode === 'air' ? 2 : mode === 'sea' ? 12 : mode === 'rail' ? 5 : 4,
        submittedAt: dateStr,
        status: isWinner ? 'Accepted' : (status === 'Won' ? 'Rejected' : 'Pending'),
        remarks: 'Automated match system bid.'
      });
    });

    leads.push({
      id: `lead-h${i}`,
      name: `Historical Customer ${i}`,
      phone: `98765${10000 + i}`,
      email: `hist.cust${i}@example.com`,
      company: `Industrial Enterprise ${i} Ltd`,
      monthlyVolume: volume,
      originPincode: origin.pin,
      destPincode: dest.pin,
      originState: origin.name,
      destState: dest.name,
      weightKg,
      commodity,
      mode,
      calculatedCost,
      score,
      urgency,
      isHot,
      leadCost,
      createdAt: dateStr,
      status,
      assignedForwarderId,
      bids
    });
  }

  const invoices: Invoice[] = [];
  const months = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026'];
  
  months.forEach((m, mIdx) => {
    const monthNumber = mIdx + 1;
    const monthLeads = leads.filter(l => l.status === 'Won' && l.createdAt.startsWith(`2026-0${monthNumber}`));
    
    forwarders.forEach(f => {
      const fwdWonLeads = monthLeads.filter(l => l.assignedForwarderId === f.id);
      if (fwdWonLeads.length === 0) return;

      const subtotal = fwdWonLeads.reduce((sum, l) => sum + l.leadCost, 0);
      const cgst = Math.round(subtotal * 0.09);
      const sgst = Math.round(subtotal * 0.09);
      const total = subtotal + cgst + sgst;

      invoices.push({
        id: `inv-${f.id.split('-')[1]}-2026-0${monthNumber}`,
        forwarderId: f.id,
        forwarderName: f.name,
        month: m,
        leadsCount: fwdWonLeads.length,
        subtotal,
        cgst,
        sgst,
        total,
        status: mIdx < 5 ? 'Paid' : 'Unpaid',
        createdAt: `2026-0${monthNumber}-28T18:00:00.000Z`,
        paidAt: mIdx < 5 ? `2026-0${monthNumber}-29T11:00:00.000Z` : undefined
      });
    });
  });

  saveLeads(leads);
  saveInvoices(invoices);
  return leads;
}

// Database helper functions

export function getLeads(): Lead[] {
  if (!fs.existsSync(LEADS_FILE)) {
    return seedLeads();
  }
  try {
    const content = fs.readFileSync(LEADS_FILE, 'utf-8');
    const parsed = JSON.parse(content || '[]');
    if (parsed.length === 0) {
      return seedLeads();
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse leads.json, returning empty list', e);
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

export function getForwarders(): Forwarder[] {
  if (!fs.existsSync(FORWARDERS_FILE)) {
    return MOCK_FORWARDERS;
  }
  try {
    const content = fs.readFileSync(FORWARDERS_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (e) {
    console.error('Failed to parse forwarders.json', e);
    return MOCK_FORWARDERS;
  }
}

export function saveForwarders(forwarders: Forwarder[]): void {
  fs.writeFileSync(FORWARDERS_FILE, JSON.stringify(forwarders, null, 2), 'utf-8');
}

export function getInvoices(): Invoice[] {
  if (!fs.existsSync(INVOICES_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(INVOICES_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (e) {
    console.error('Failed to parse invoices.json', e);
    return [];
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf-8');
}
