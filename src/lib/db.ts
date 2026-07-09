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

// Database helper functions

export function getLeads(): Lead[] {
  if (!fs.existsSync(LEADS_FILE)) {
    return [];
  }
  try {
    const content = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(content || '[]');
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
