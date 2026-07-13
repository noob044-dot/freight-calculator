import { Lead, Forwarder, Invoice, ForwarderRate, Bid } from '@/lib/api/contracts';

export interface UserRecord {
  id: string;
  email: string;
  password?: string; // Hashed or clear for mock
  name: string;
  role: 'Shipper' | 'Forwarder' | 'admin' | 'viewer';
  orgId: string;
  onboardingComplete: boolean;
}

export interface OrgRecord {
  id: string;
  name: string;
  size: string;
  trialExpiresAt: string;
  createdAt: string;
}

export interface OnboardingStateRecord {
  userId: string;
  currentStep: number;
  role: string;
  companyName: string;
  gstin: string;
  preferredModes: string[];
  preferredLanes: string[];
}

const isClient = typeof window !== 'undefined';

// Helper to load/save tables from localStorage
function loadTable<T>(key: string, seed: T[]): T[] {
  if (!isClient) return seed;
  const saved = localStorage.getItem(`db_${key}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return seed;
    }
  }
  localStorage.setItem(`db_${key}`, JSON.stringify(seed));
  return seed;
}

function saveTable<T>(key: string, data: T[]) {
  if (isClient) {
    localStorage.setItem(`db_${key}`, JSON.stringify(data));
  }
}

// ============================================================================
// SEED DATA DEFINTIONS
// ============================================================================

const SEED_ORG: OrgRecord[] = [
  {
    id: 'org-premium',
    name: 'Logistics Prime Corp',
    size: '100-500',
    trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    createdAt: new Date().toISOString(),
  }
];

const SEED_USERS: UserRecord[] = [
  {
    id: 'usr-admin',
    email: 'admin@freightquote.in',
    password: 'Freight@2026',
    name: 'Corporate Sourcing Admin',
    role: 'admin',
    orgId: 'org-premium',
    onboardingComplete: true,
  },
  {
    id: 'usr-fwd-safexpress',
    email: 'safexpress@freightquote.in',
    password: 'Freight@2026',
    name: 'Safexpress Dispatcher',
    role: 'Forwarder',
    orgId: 'org-premium',
    onboardingComplete: true,
  }
];

const SEED_FORWARDERS: Forwarder[] = [
  {
    id: 'fwd-safexpress',
    name: 'Safexpress Logistics',
    gstin: '27AAFCS4123K1Z1',
    rating: 4.8,
    responseSlaMins: 24,
    winRate: 78,
    coveredLanes: ['MAHARASHTRA', 'GUJARAT', 'DELHI', 'KARNATAKA', 'TAMIL NADU'],
    supportedModes: ['road', 'rail'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'road', basePrice: 15000, pricePerKg: 4.5 },
      { originState: 'MAHARASHTRA', destState: 'GUJARAT', mode: 'road', basePrice: 8000, pricePerKg: 3.2 },
      { originState: 'KARNATAKA', destState: 'TAMIL NADU', mode: 'road', basePrice: 6000, pricePerKg: 2.8 },
      { originState: 'DELHI', destState: 'MAHARASHTRA', mode: 'road', basePrice: 16000, pricePerKg: 4.2 },
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'rail', basePrice: 12000, pricePerKg: 3.5 }
    ]
  },
  {
    id: 'fwd-bluedart',
    name: 'Blue Dart FTL Express',
    gstin: '27AAACB8765A1Z5',
    rating: 4.9,
    responseSlaMins: 12,
    winRate: 85,
    coveredLanes: ['MAHARASHTRA', 'DELHI', 'KARNATAKA', 'TAMIL NADU', 'HARYANA'],
    supportedModes: ['road', 'air'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'road', basePrice: 18000, pricePerKg: 5.5 },
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'air', basePrice: 35000, pricePerKg: 12.0 },
      { originState: 'KARNATAKA', destState: 'MAHARASHTRA', mode: 'air', basePrice: 28000, pricePerKg: 9.8 }
    ]
  },
  {
    id: 'fwd-gatilogi',
    name: 'Gati KWE Sourcing',
    gstin: '36AAACG4411C2Z9',
    rating: 4.2,
    responseSlaMins: 36,
    winRate: 64,
    coveredLanes: ['MAHARASHTRA', 'GUJARAT', 'DELHI', 'RAJASTHAN', 'PUNJAB'],
    supportedModes: ['road', 'rail', 'sea'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'road', basePrice: 13500, pricePerKg: 3.9 },
      { originState: 'GUJARAT', destState: 'MAHARASHTRA', mode: 'road', basePrice: 7500, pricePerKg: 2.9 }
    ]
  },
  {
    id: 'fwd-dhlftl',
    name: 'DHL Express India',
    gstin: '27AAACD9911C1Z0',
    rating: 4.9,
    responseSlaMins: 8,
    winRate: 92,
    coveredLanes: ['MAHARASHTRA', 'GUJARAT', 'DELHI', 'KARNATAKA', 'TAMIL NADU', 'WEST BENGAL'],
    supportedModes: ['road', 'air', 'sea'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'air', basePrice: 42000, pricePerKg: 15.0 },
      { originState: 'MAHARASHTRA', destState: 'WEST BENGAL', mode: 'sea', basePrice: 28000, pricePerKg: 6.5 }
    ]
  },
  {
    id: 'fwd-spicexpress',
    name: 'SpiceXpress Cargo',
    gstin: '07AAFCS1100C1Z4',
    rating: 4.5,
    responseSlaMins: 15,
    winRate: 70,
    coveredLanes: ['MAHARASHTRA', 'DELHI', 'KARNATAKA', 'TAMIL NADU', 'WEST BENGAL'],
    supportedModes: ['air'],
    rateCard: [
      { originState: 'MAHARASHTRA', destState: 'DELHI', mode: 'air', basePrice: 32000, pricePerKg: 10.5 }
    ]
  }
];

const SEED_LEADS: Lead[] = [
  {
    id: 'lead-101',
    name: 'Rohan Sharma',
    phone: '+91 98765 43210',
    email: 'rohan.sharma@tata.com',
    company: 'Tata Steel Ltd',
    monthlyVolume: '20+',
    originPincode: '400001',
    destPincode: '110001',
    originState: 'MAHARASHTRA',
    destState: 'DELHI',
    weightKg: 15000,
    commodity: 'steel-hr',
    mode: 'road',
    calculatedCost: 82500,
    score: 88,
    urgency: 'high',
    isHot: true,
    leadCost: 1000,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
    status: 'Quoted',
    assignedForwarderId: null,
    bids: [
      { forwarderId: 'fwd-safexpress', forwarderName: 'Safexpress Logistics', amount: 84500, transitDays: 4, submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(), status: 'Pending' },
      { forwarderId: 'fwd-bluedart', forwarderName: 'Blue Dart FTL Express', amount: 89000, transitDays: 3, submittedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(), status: 'Pending' }
    ]
  },
  {
    id: 'lead-102',
    name: 'Anjali Patel',
    phone: '+91 87654 32109',
    email: 'contact@relianceind.com',
    company: 'Reliance Industries',
    monthlyVolume: '20+',
    originPincode: '390001',
    destPincode: '400001',
    originState: 'GUJARAT',
    destState: 'MAHARASHTRA',
    weightKg: 8500,
    commodity: 'petrol',
    mode: 'road',
    calculatedCost: 32650,
    score: 95,
    urgency: 'high',
    isHot: true,
    leadCost: 1000,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), // 1h ago
    status: 'New',
    assignedForwarderId: null,
    bids: []
  },
  {
    id: 'lead-103',
    name: 'Suresh Kumar',
    phone: '+91 76543 21098',
    email: 'suresh@cipla.com',
    company: 'Cipla Pharmaceuticals',
    monthlyVolume: '6-20',
    originPincode: '400001',
    destPincode: '560001',
    originState: 'MAHARASHTRA',
    destState: 'KARNATAKA',
    weightKg: 2000,
    commodity: 'pharma-api',
    mode: 'air',
    calculatedCost: 51200,
    score: 82,
    urgency: 'medium',
    isHot: false,
    leadCost: 500,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24h ago
    status: 'Contacted',
    assignedForwarderId: null,
    bids: []
  },
  {
    id: 'lead-104',
    name: 'Aditya Birla',
    phone: '+91 65432 10987',
    email: 'sourcing@ultratech.com',
    company: 'UltraTech Cement',
    monthlyVolume: '20+',
    originPincode: '400001',
    destPincode: '110001',
    originState: 'MAHARASHTRA',
    destState: 'DELHI',
    weightKg: 25000,
    commodity: 'cement-ordinary',
    mode: 'rail',
    calculatedCost: 99500,
    score: 75,
    urgency: 'low',
    isHot: false,
    leadCost: 500,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    status: 'Quoted',
    assignedForwarderId: null,
    bids: [
      { forwarderId: 'fwd-gatilogi', forwarderName: 'Gati KWE Sourcing', amount: 98000, transitDays: 5, submittedAt: new Date(Date.now() - 3600000 * 20).toISOString(), status: 'Pending' }
    ]
  },
  {
    id: 'lead-105',
    name: 'Devendra Mehta',
    phone: '+91 99112 23344',
    email: 'dev@marutisuzuki.com',
    company: 'Maruti Suzuki Ltd',
    monthlyVolume: '20+',
    originPincode: '122015',
    destPincode: '400001',
    originState: 'HARYANA',
    destState: 'MAHARASHTRA',
    weightKg: 12000,
    commodity: 'auto-parts',
    mode: 'road',
    calculatedCost: 66400,
    score: 91,
    urgency: 'high',
    isHot: true,
    leadCost: 1000,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'Won',
    assignedForwarderId: 'fwd-safexpress',
    bids: [
      { forwarderId: 'fwd-safexpress', forwarderName: 'Safexpress Logistics', amount: 64800, transitDays: 4, submittedAt: new Date(Date.now() - 3600000 * 46).toISOString(), status: 'Accepted' }
    ]
  },
  {
    id: 'lead-106',
    name: 'Rajesh Varma',
    phone: '+91 88776 65544',
    email: 'r.varma@itc.in',
    company: 'ITC Limited',
    monthlyVolume: '6-20',
    originPincode: '400001',
    destPincode: '110001',
    originState: 'MAHARASHTRA',
    destState: 'DELHI',
    weightKg: 5000,
    commodity: 'fmcg',
    mode: 'road',
    calculatedCost: 37500,
    score: 79,
    urgency: 'medium',
    isHot: false,
    leadCost: 500,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: 'New',
    assignedForwarderId: null,
    bids: []
  },
  {
    id: 'lead-107',
    name: 'Meera Nair',
    phone: '+91 77665 54433',
    email: 'meera@huel.com',
    company: 'Hindustan Unilever',
    monthlyVolume: '20+',
    originPincode: '400001',
    destPincode: '560001',
    originState: 'MAHARASHTRA',
    destState: 'KARNATAKA',
    weightKg: 10000,
    commodity: 'fmcg',
    mode: 'road',
    calculatedCost: 54000,
    score: 93,
    urgency: 'high',
    isHot: true,
    leadCost: 1000,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    status: 'Lost',
    assignedForwarderId: null,
    bids: []
  },
  {
    id: 'lead-108',
    name: 'Preeti Deshmukh',
    phone: '+91 99001 12233',
    email: 'preeti@larsenandtoubro.com',
    company: 'Larsen & Toubro',
    monthlyVolume: '6-20',
    originPincode: '400001',
    destPincode: '700001',
    originState: 'MAHARASHTRA',
    destState: 'WEST BENGAL',
    weightKg: 18000,
    commodity: 'machinery',
    mode: 'sea',
    calculatedCost: 145000,
    score: 86,
    urgency: 'low',
    isHot: false,
    leadCost: 500,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    status: 'Quoted',
    assignedForwarderId: null,
    bids: [
      { forwarderId: 'fwd-dhlftl', forwarderName: 'DHL Express India', amount: 142000, transitDays: 8, submittedAt: new Date(Date.now() - 3600000 * 110).toISOString(), status: 'Pending' }
    ]
  },
  {
    id: 'lead-109',
    name: 'Vivek Oberoi',
    phone: '+91 88990 01122',
    email: 'vivek@mahindra.com',
    company: 'Mahindra & Mahindra',
    monthlyVolume: '20+',
    originPincode: '400001',
    destPincode: '110001',
    originState: 'MAHARASHTRA',
    destState: 'DELHI',
    weightKg: 11000,
    commodity: 'auto-parts',
    mode: 'road',
    calculatedCost: 64500,
    score: 89,
    urgency: 'high',
    isHot: true,
    leadCost: 1000,
    createdAt: new Date(Date.now() - 3600000 * 144).toISOString(),
    status: 'Contacted',
    assignedForwarderId: null,
    bids: []
  },
  {
    id: 'lead-110',
    name: 'Karan Johar',
    phone: '+91 77889 90011',
    email: 'sourcing@godrej.com',
    company: 'Godrej Consumer',
    monthlyVolume: '6-20',
    originPincode: '400001',
    destPincode: '110001',
    originState: 'MAHARASHTRA',
    destState: 'DELHI',
    weightKg: 7500,
    commodity: 'furniture',
    mode: 'road',
    calculatedCost: 48900,
    score: 80,
    urgency: 'medium',
    isHot: false,
    leadCost: 500,
    createdAt: new Date(Date.now() - 3600000 * 168).toISOString(),
    status: 'Won',
    assignedForwarderId: 'fwd-bluedart',
    bids: [
      { forwarderId: 'fwd-bluedart', forwarderName: 'Blue Dart FTL Express', amount: 49500, transitDays: 4, submittedAt: new Date(Date.now() - 3600000 * 160).toISOString(), status: 'Accepted' }
    ]
  }
];

const SEED_INVOICES: Invoice[] = [
  ...Array.from({ length: 20 }).map((_, idx) => {
    const forwarder = SEED_FORWARDERS[idx % SEED_FORWARDERS.length];
    const subtotal = 10000 + (idx * 1500);
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const total = subtotal + cgst + sgst;
    
    // Stagger dates across months
    const date = new Date(Date.now() - (idx * 5 * 24 * 60 * 60 * 1000));
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    return {
      id: `inv-${2000 + idx}`,
      forwarderId: forwarder.id,
      forwarderName: forwarder.name,
      month,
      leadsCount: 5 + (idx % 8),
      subtotal,
      cgst,
      sgst,
      total,
      status: idx < 8 ? ('Paid' as const) : ('Unpaid' as const),
      createdAt: date.toISOString(),
      paidAt: idx < 8 ? new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };
  })
];

// ============================================================================
// SIMULATED DATABASE IMPLEMENTATION
// ============================================================================

export const mockDb = {
  // --- USERS ---
  users: {
    find: (email: string) => {
      const table = loadTable<UserRecord>('users', SEED_USERS);
      return table.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    create: (user: Omit<UserRecord, 'id'>) => {
      const table = loadTable<UserRecord>('users', SEED_USERS);
      const newRecord: UserRecord = {
        ...user,
        id: `usr-${Math.random().toString(36).substr(2, 9)}`
      };
      table.push(newRecord);
      saveTable('users', table);
      return newRecord;
    },
    update: (id: string, updates: Partial<UserRecord>) => {
      const table = loadTable<UserRecord>('users', SEED_USERS);
      const idx = table.findIndex(u => u.id === id);
      if (idx === -1) return null;
      table[idx] = { ...table[idx], ...updates };
      saveTable('users', table);
      return table[idx];
    }
  },

  // --- ORGS ---
  orgs: {
    get: (id: string) => {
      const table = loadTable<OrgRecord>('orgs', SEED_ORG);
      return table.find(o => o.id === id) || null;
    },
    create: (name: string, size: string) => {
      const table = loadTable<OrgRecord>('orgs', SEED_ORG);
      const newOrg: OrgRecord = {
        id: `org-${Math.random().toString(36).substr(2, 9)}`,
        name,
        size,
        trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      table.push(newOrg);
      saveTable('orgs', table);
      return newOrg;
    }
  },

  // --- LEADS ---
  leads: {
    list: (filter?: { status?: string; search?: string }, sort?: { key: keyof Lead; order: 'asc' | 'desc' }) => {
      let data = loadTable<Lead>('leads', SEED_LEADS);

      // Filtering
      if (filter?.status) {
        data = data.filter(l => l.status === filter.status);
      }
      if (filter?.search) {
        const query = filter.search.toLowerCase();
        data = data.filter(l => 
          l.company.toLowerCase().includes(query) ||
          l.name.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query) ||
          l.commodity.toLowerCase().includes(query)
        );
      }

      // Sorting
      if (sort) {
        data.sort((a, b) => {
          const valA = a[sort.key];
          const valB = b[sort.key];
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'string' && typeof valB === 'string') {
            return sort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sort.order === 'asc' 
            ? (valA as number) - (valB as number) 
            : (valB as number) - (valA as number);
        });
      }
      return data;
    },
    get: (id: string) => {
      const table = loadTable<Lead>('leads', SEED_LEADS);
      return table.find(l => l.id === id) || null;
    },
    create: (lead: Omit<Lead, 'id' | 'createdAt' | 'bids' | 'assignedForwarderId' | 'score' | 'leadCost'>) => {
      const table = loadTable<Lead>('leads', SEED_LEADS);
      const newLead: Lead = {
        ...lead,
        id: `lead-${100 + table.length + 1}`,
        createdAt: new Date().toISOString(),
        score: Math.floor(65 + Math.random() * 30),
        leadCost: lead.weightKg > 10000 ? 1000 : 500,
        bids: [],
        assignedForwarderId: null
      };
      table.push(newLead);
      saveTable('leads', table);
      return newLead;
    },
    update: (id: string, updates: Partial<Lead>) => {
      const table = loadTable<Lead>('leads', SEED_LEADS);
      const idx = table.findIndex(l => l.id === id);
      if (idx === -1) return null;
      table[idx] = { ...table[idx], ...updates } as Lead;
      saveTable('leads', table);
      return table[idx];
    },
    addBid: (leadId: string, bid: Bid) => {
      const table = loadTable<Lead>('leads', SEED_LEADS);
      const idx = table.findIndex(l => l.id === leadId);
      if (idx === -1) return null;
      table[idx].bids.push(bid);
      saveTable('leads', table);
      return table[idx];
    }
  },

  // --- FORWARDERS ---
  forwarders: {
    list: () => {
      return loadTable<Forwarder>('forwarders', SEED_FORWARDERS);
    },
    get: (id: string) => {
      const table = loadTable<Forwarder>('forwarders', SEED_FORWARDERS);
      return table.find(f => f.id === id) || null;
    },
    updateRate: (forwarderId: string, rateIndex: number, updates: Partial<ForwarderRate>) => {
      const table = loadTable<Forwarder>('forwarders', SEED_FORWARDERS);
      const fIdx = table.findIndex(f => f.id === forwarderId);
      if (fIdx === -1) return null;
      
      const rates = table[fIdx].rateCard;
      if (rateIndex < 0 || rateIndex >= rates.length) return null;
      
      rates[rateIndex] = { ...rates[rateIndex], ...updates } as ForwarderRate;
      saveTable('forwarders', table);
      return table[fIdx];
    },
    deleteRate: (forwarderId: string, rateIndex: number) => {
      const table = loadTable<Forwarder>('forwarders', SEED_FORWARDERS);
      const fIdx = table.findIndex(f => f.id === forwarderId);
      if (fIdx === -1) return null;
      
      table[fIdx].rateCard.splice(rateIndex, 1);
      saveTable('forwarders', table);
      return table[fIdx];
    },
    addRate: (forwarderId: string, rate: ForwarderRate) => {
      const table = loadTable<Forwarder>('forwarders', SEED_FORWARDERS);
      const fIdx = table.findIndex(f => f.id === forwarderId);
      if (fIdx === -1) return null;
      
      table[fIdx].rateCard.push(rate);
      saveTable('forwarders', table);
      return table[fIdx];
    }
  },

  // --- INVOICES ---
  invoices: {
    list: () => {
      return loadTable<Invoice>('invoices', SEED_INVOICES);
    },
    get: (id: string) => {
      const table = loadTable<Invoice>('invoices', SEED_INVOICES);
      return table.find(i => i.id === id) || null;
    },
    updateStatus: (id: string, status: 'Paid' | 'Unpaid') => {
      const table = loadTable<Invoice>('invoices', SEED_INVOICES);
      const idx = table.findIndex(i => i.id === id);
      if (idx === -1) return null;
      table[idx].status = status;
      table[idx].paidAt = status === 'Paid' ? new Date().toISOString() : undefined;
      saveTable('invoices', table);
      return table[idx];
    }
  },

  // --- ONBOARDING STATE ---
  onboarding: {
    get: (userId: string): OnboardingStateRecord | null => {
      const table = loadTable<OnboardingStateRecord>('onboarding_states', []);
      return table.find(o => o.userId === userId) || null;
    },
    save: (userId: string, data: Partial<OnboardingStateRecord>) => {
      const table = loadTable<OnboardingStateRecord>('onboarding_states', []);
      const idx = table.findIndex(o => o.userId === userId);
      const baseRecord: OnboardingStateRecord = {
        userId,
        currentStep: 1,
        role: '',
        companyName: '',
        gstin: '',
        preferredModes: [],
        preferredLanes: []
      };

      if (idx === -1) {
        const newRecord = { ...baseRecord, ...data };
        table.push(newRecord);
        saveTable('onboarding_states', table);
        return newRecord;
      } else {
        table[idx] = { ...table[idx], ...data };
        saveTable('onboarding_states', table);
        return table[idx];
      }
    }
  }
};
