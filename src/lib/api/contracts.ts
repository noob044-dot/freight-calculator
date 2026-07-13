import { z } from 'zod';

// ============================================================================
// 1. QUOTE SYSTEM (/api/quote)
// ============================================================================

export const tollPlazaSchema = z.object({
  name: z.string(),
  state: z.string(),
  tollAmount: z.number(),
});

export const quoteBreakdownSchema = z.object({
  baseFreight: z.number(),
  fuelSurcharge: z.number(),
  commodityAdjustment: z.number(),
  tolls: z.number(),
  pickupLastMile: z.number(),
  deliveryLastMile: z.number(),
  entryTax: z.number(),
  insurance: z.number(),
  documentation: z.number(),
});

export const quoteResultSchema = z.object({
  mode: z.enum(['road', 'air', 'sea', 'rail']),
  distanceKm: z.number(),
  durationHrs: z.number(),
  vehicle: z.string(),
  tollPlazas: z.array(tollPlazaSchema).optional(),
  breakdown: quoteBreakdownSchema,
  total: z.number(),
  perKg: z.number(),
  confidence: z.number(),
  transitDays: z.number(),
  originName: z.string(),
  destName: z.string(),
});

export const quoteRequestSchema = z.object({
  originPincode: z.string().regex(/^\d{6}$/, "Must be a valid 6-digit PIN"),
  destPincode: z.string().regex(/^\d{6}$/, "Must be a valid 6-digit PIN"),
  weightKg: z.number().min(100).max(50000),
  commodity: z.string(),
  valueInr: z.number().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  vehicleType: z.string().optional(),
  containerType: z.string().optional(),
  incoterm: z.enum(['EXW', 'FOB', 'CIF', 'CFR']).optional(),
});

export const quoteResponseSchema = z.object({
  success: z.boolean(),
  quotes: z.record(z.string(), quoteResultSchema.extend({ error: z.string().optional() })),
  benchmarks: z.record(z.string(), z.object({
    freightosIndex: z.number(),
    cogoport: z.number(),
    freightwalla: z.number(),
    delex: z.number(),
    average: z.number(),
    savingsVsAverage: z.number(),
  })),
});

// ============================================================================
// 2. LEADS PIPELINE (/api/leads)
// ============================================================================

export const bidSchema = z.object({
  forwarderId: z.string(),
  forwarderName: z.string(),
  amount: z.number(),
  transitDays: z.number(),
  submittedAt: z.string(),
  status: z.enum(['Pending', 'Accepted', 'Rejected']),
  remarks: z.string().optional(),
});

export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  company: z.string(),
  monthlyVolume: z.string(),
  originPincode: z.string(),
  destPincode: z.string(),
  originState: z.string(),
  destState: z.string(),
  weightKg: z.number(),
  commodity: z.string(),
  mode: z.enum(['road', 'air', 'sea', 'rail']),
  calculatedCost: z.number(),
  score: z.number(),
  urgency: z.enum(['high', 'medium', 'low']),
  isHot: z.boolean(),
  leadCost: z.number(),
  createdAt: z.string(),
  status: z.enum(['New', 'Contacted', 'Quoted', 'Won', 'Lost']),
  assignedForwarderId: z.string().nullable(),
  bids: z.array(bidSchema),
});

export const createLeadRequestSchema = leadSchema.omit({
  id: true,
  createdAt: true,
  score: true,
  leadCost: true,
  bids: true,
  assignedForwarderId: true,
});

// ============================================================================
// 3. FORWARDERS DIRECTORY (/api/forwarders)
// ============================================================================

export const forwarderRateSchema = z.object({
  originState: z.string(),
  destState: z.string(),
  mode: z.enum(['road', 'air', 'sea', 'rail']),
  basePrice: z.number(),
  pricePerKg: z.number(),
  commodity: z.string().optional(),
});

export const forwarderSchema = z.object({
  id: z.string(),
  name: z.string(),
  gstin: z.string(),
  rating: z.number(),
  responseSlaMins: z.number(),
  winRate: z.number(),
  coveredLanes: z.array(z.string()),
  supportedModes: z.array(z.enum(['road', 'air', 'sea', 'rail'])),
  rateCard: z.array(forwarderRateSchema),
});

export const updateRateRequestSchema = z.object({
  forwarderId: z.string(),
  rateIndex: z.number(),
  basePrice: z.number().optional(),
  pricePerKg: z.number().optional(),
});

// ============================================================================
// 4. BILLING & INVOICES (/api/invoices)
// ============================================================================

export const invoiceSchema = z.object({
  id: z.string(),
  forwarderId: z.string(),
  forwarderName: z.string(),
  month: z.string(),
  leadsCount: z.number(),
  subtotal: z.number(),
  cgst: z.number(),
  sgst: z.number(),
  total: z.number(),
  status: z.enum(['Paid', 'Unpaid']),
  createdAt: z.string(),
  paidAt: z.string().optional(),
});

export const payInvoiceRequestSchema = z.object({
  invoiceId: z.string(),
  paymentMethod: z.string(),
});

// ============================================================================
// 5. LIVE BIDDING SSE SYSTEM (/api/bids/stream)
// ============================================================================

export const sseBidEventSchema = z.object({
  type: z.literal('bid_received'),
  leadId: z.string(),
  bid: bidSchema,
});

export const sseLeadEventSchema = z.object({
  type: z.literal('lead_updated'),
  leadId: z.string(),
  status: z.enum(['New', 'Contacted', 'Quoted', 'Won', 'Lost']),
});

export const sseEventSchema = z.discriminatedUnion('type', [
  sseBidEventSchema,
  sseLeadEventSchema,
]);

// ============================================================================
// 6. AUTHENTICATION MODULES
// ============================================================================

export const loginRequestSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid corporate email'),
  password: z.string().min(1, 'Password is required').min(8, 'Minimum 8 characters required'),
});

export const registerRequestSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid corporate email'),
  password: z.string().min(1, 'Password is required').min(8, 'Minimum 8 characters required'),
  role: z.enum(['Shipper', 'Forwarder']),
  orgSize: z.string().min(1, 'Organization size is required'),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms & conditions',
  }),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid corporate email'),
});

export const verifyRequestSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ============================================================================
// TYPE EXPORTS INFERRED FROM SCHEMAS
// ============================================================================

export type TollPlaza = z.infer<typeof tollPlazaSchema>;
export type QuoteBreakdown = z.infer<typeof quoteBreakdownSchema>;
export type QuoteResult = z.infer<typeof quoteResultSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;

export type Bid = z.infer<typeof bidSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type CreateLeadRequest = z.infer<typeof createLeadRequestSchema>;

export type ForwarderRate = z.infer<typeof forwarderRateSchema>;
export type Forwarder = z.infer<typeof forwarderSchema>;
export type UpdateRateRequest = z.infer<typeof updateRateRequestSchema>;

export type Invoice = z.infer<typeof invoiceSchema>;
export type PayInvoiceRequest = z.infer<typeof payInvoiceRequestSchema>;

export type SSEBidEvent = z.infer<typeof sseBidEventSchema>;
export type SSELeadEvent = z.infer<typeof sseLeadEventSchema>;
export type SSEEvent = z.infer<typeof sseEventSchema>;

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
