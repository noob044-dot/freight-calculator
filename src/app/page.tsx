"use client";

import React, { useState } from 'react';
import { 
  Truck, Shield, Zap, Check, X, Users, 
  BarChart2, Calculator, CreditCard, ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { PincodeAutocomplete } from '../components/PincodeAutocomplete';
import { ModeSelector, TransportMode } from '../components/ModeSelector';
import { QuoteResults } from '../components/QuoteResults';
import { QuoteResult, Benchmark } from '../lib/types';

const COMMODITIES = [
  { code: 'general', name: 'General Cargo' },
  { code: 'auto-parts', name: 'Auto Parts' },
  { code: 'pharma', name: 'Pharma / Cold Chain' },
  { code: 'hazardous', name: 'Hazardous / DG' },
  { code: 'perishable', name: 'Perishable (F&V)' },
  { code: 'odc', name: 'Over-Dimensional' },
  { code: 'steel', name: 'Steel / Cement' },
  { code: 'textiles', name: 'Textiles' },
  { code: 'electronics', name: 'Electronics' },
  { code: 'chemicals', name: 'Chemicals' },
  { code: 'fmcg', name: 'FMCG' },
  { code: 'machinery', name: 'Machinery' },
  { code: 'furniture', name: 'Furniture' },
  { code: 'paper', name: 'Paper / Packaging' },
  { code: 'plastic', name: 'Plastic Granules' },
];

const VEHICLES = [
  { code: 'auto', name: 'Auto-Select (Recommended)' },
  { code: '16T', name: '16 Ton Truck (2 Axle)' },
  { code: '25T', name: '25 Ton Truck (3 Axle)' },
  { code: '40T', name: '40 Ton Trailer (4-6 Axle)' },
];

const CONTAINER_TYPES = [
  { code: 'auto', name: 'Auto-Select Container' },
  { code: '20ft_GP', name: '20ft General Purpose' },
  { code: '40ft_GP', name: '40ft General Purpose' },
  { code: '40ft_HC', name: '40ft High Cube' },
  { code: '20ft_RF', name: '20ft Reefer' },
  { code: '40ft_RF', name: '40ft Reefer' },
];

const INCOTERMS = [
  { code: 'EXW', name: 'EXW (Ex Works)' },
  { code: 'FOB', name: 'FOB (Free on Board)' },
  { code: 'CIF', name: 'CIF (Cost, Insurance & Freight)' },
  { code: 'CFR', name: 'CFR (Cost & Freight)' },
];

const BENEFITS = [
  { icon: Truck, title: "Exact Toll Breakdown", desc: "NHAI-verified toll plaza list with rates per vehicle type" },
  { icon: Globe, title: "Pincode Precision", desc: "19,000+ pincodes with exact lat/lon, state, GST code & delivery zone" },
  { icon: Shield, title: "GST Compliant", desc: "Auto inter-state tax, entry tax & e-way bill ready calculations" },
  { icon: FileText, title: "Multi-Format Export", desc: "PDF, Excel, JSON, CSV — ready for accounting & ERP systems" },
  { icon: Zap, title: "Instant Multi-Modal", desc: "Instant comparison across Road, Air, Sea and Rail in a single click" },
  { icon: BarChart2, title: "Competitor Benchmarks", desc: "Estimated Freightos Index + scraped rates from Cogoport, Delex" },
];

const FEATURES = [
  { icon: Calculator, title: "Smart Vehicle Selection", desc: "Auto-selects 16T/25T/40T based on weight & commodity requirements" },
  { icon: CreditCard, title: "Cargo Valuation & Insurance", desc: "Auto insurance calculations at 0.3% of cargo value with minimum limits" },
  { icon: Users, title: "Lead Generation", desc: "Convert quotes to qualified leads and send directly to active forwarders" },
  { icon: BarChart2, title: "Competitive Analytics", desc: "Compare pricing against market averages to optimize transport routing" },
];

const TESTIMONIALS = [
  { name: "Rajesh Kumar", role: "Logistics Head", company: "AutoTech Components", quote: "Cut quote time from 4 hours to 30 seconds. Toll breakdown alone saves us ₹2L/month in carrier disputes.", avatar: "RK" },
  { name: "Priya Sharma", role: "Procurement Manager", company: "MediPharma Ltd", quote: "First tool that shows competitor rates honestly. We negotiate 15% better with our freight agents now.", avatar: "PS" },
  { name: "Amit Patel", role: "Owner", company: "Patel Roadlines", quote: "My drivers get exact toll slips. Clients get professional PDFs. Has saved countless invoicing arguments.", avatar: "AP" },
];

const PRICING = [
  { name: "Free", price: "₹0", period: "/month", desc: "Ideal for basic estimation and casual shipping.", features: ["Unlimited Road FTL quotes", "Pincode autocomplete", "PDF report export", "Basic toll breakdown", "Community support"], cta: "Get Started Free", highlight: false },
  { name: "Pro", price: "₹999", period: "/month", desc: "For logistics coordinators and growing businesses.", features: ["Everything in Free", "Competitor benchmarks", "Excel & JSON export formats", "Advanced toll calculations", "Quote history & API access (1k calls)", "Email support"], cta: "Upgrade to Pro", highlight: true },
  { name: "Enterprise", price: "₹2,999", period: "/month", desc: "For full freight forwarders and ERP integrations.", features: ["Everything in Pro", "Air, Sea & Rail engines", "Incoterm & container customization", "White-label quote reports", "Unlimited API integrations", "Dedicated 24/7 account manager"], cta: "Contact Sales", highlight: false },
];

export default function Home() {
  const [activeMode, setActiveMode] = useState<TransportMode>('all');
  const [origin, setOrigin] = useState('400001');
  const [dest, setDest] = useState('110001');
  const [weight, setWeight] = useState('10000');
  const [commodity, setCommodity] = useState('general');
  
  // Road parameters
  const [vehicle, setVehicle] = useState('auto');
  
  // Sea parameters
  const [containerType, setContainerType] = useState('auto');
  const [incoterm, setIncoterm] = useState('EXW');

  // Cargo value & dimensions
  const [cargoValue, setCargoValue] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });

  // Calculation Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // States to hold the dynamic responses
  const [allQuotes, setAllQuotes] = useState<Record<string, QuoteResult & { error?: string }>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<Record<string, Benchmark>>({});

  // Lead capture form
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', company: '', volume: '1-5' });
  const [leadSuccess, setLeadSuccess] = useState(false);

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const payload = {
        originPincode: origin,
        destPincode: dest,
        weightKg: Number(weight),
        commodity,
        vehicleType: vehicle === 'auto' ? undefined : vehicle,
        valueInr: cargoValue ? Number(cargoValue) : undefined,
        dimensions: (dimensions.length || dimensions.width || dimensions.height) ? {
          length: Number(dimensions.length || 0),
          width: Number(dimensions.width || 0),
          height: Number(dimensions.height || 0),
        } : undefined,
        containerType: containerType === 'auto' ? undefined : containerType,
        incoterm,
      };

      // Call API using mode=all to fetch all comparison quotes at once
      const res = await fetch(`/api/quote?mode=all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to calculate quote');
      }

      const data = await res.json();
      setAllQuotes(data.quotes || {});
      setAllBenchmarks(data.benchmarks || {});
      setShowResults(true);

      // Scroll smoothly to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Calculation failed. Please verify the inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate lead capture
    setLeadSuccess(true);
    setLeadForm({ name: '', phone: '', email: '', company: '', volume: '1-5' });
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-bg text-fg font-sans antialiased selection:bg-accent-soft selection:text-accent">
      
      {/* 1. Header/Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-accent" />
              <span className="text-md font-bold tracking-tight text-fg font-mono">FreightQuote.in</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-fg-muted text-xs uppercase font-bold tracking-wider">
              <a href="#features" className="hover:text-fg transition-colors">Features</a>
              <a href="#benefits" className="hover:text-fg transition-colors">Benefits</a>
              <a href="#pricing" className="hover:text-fg transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-fg transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-xs uppercase font-bold text-fg-muted hover:text-fg tracking-wider">Dashboard</a>
              <a href="#calculator" className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors shadow-sm">Calculator</a>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg to-bg-elevated/40 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-accent-soft text-accent rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-accent/20">
            India&apos;s most accurate logistics engine
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-fg">
            India&apos;s Most Accurate <br />
            <span className="text-accent">Freight Calculator</span>
          </h1>
          <p className="text-md sm:text-lg text-fg-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Pincode-to-pincode accuracy, exact NHAI tolls, and multi-modal comparison engines designed for modern logistics operations.
          </p>
        </div>
      </section>

      {/* 3. Calculator Form & Sticky Container */}
      <section id="calculator" className="py-12 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card-custom border border-border rounded-xl p-6 sm:p-8 shadow-lg">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent" />
              Calculate Shipping Rate
            </h2>

            <form onSubmit={handleCalculate} className="space-y-6">
              {/* Origin / Dest Autocomplete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PincodeAutocomplete
                  label="Origin Area Pincode"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="e.g. 400001 (Mumbai)"
                />
                <PincodeAutocomplete
                  label="Destination Area Pincode"
                  value={dest}
                  onChange={setDest}
                  placeholder="e.g. 110001 (Delhi)"
                />
              </div>

              {/* Weight & Commodity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-mono"
                    placeholder="e.g. 10000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Commodity Class</label>
                  <select
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    {COMMODITIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced/Dynamic Options (Road vs Sea) */}
              <div className="border-t border-border pt-6 space-y-6">
                <h3 className="text-xs uppercase font-bold text-fg-muted tracking-wider">Mode Parameters (Customizable)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Preferred FTL Truck</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {VEHICLES.map((v) => (
                        <option key={v.code} value={v.code}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Sea Container Type</label>
                    <select
                      value={containerType}
                      onChange={(e) => setContainerType(e.target.value)}
                      className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {CONTAINER_TYPES.map((ct) => (
                        <option key={ct.code} value={ct.code}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Sea Incoterm</label>
                    <select
                      value={incoterm}
                      onChange={(e) => setIncoterm(e.target.value)}
                      className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {INCOTERMS.map((inc) => (
                        <option key={inc.code} value={inc.code}>{inc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Cargo Value (INR for Insurance)</label>
                    <input
                      type="number"
                      value={cargoValue}
                      onChange={(e) => setCargoValue(e.target.value)}
                      className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                      placeholder="Optional, e.g. 500000"
                    />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Dimensions L x W x H (Meters)</label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                      placeholder="L"
                      className="w-full bg-bg-elevated border border-border rounded-lg px-2 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono text-center"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                      placeholder="W"
                      className="w-full bg-bg-elevated border border-border rounded-lg px-2 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono text-center"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                      placeholder="H"
                      className="w-full bg-bg-elevated border border-border rounded-lg px-2 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 p-4 rounded-lg flex items-center gap-3 text-sm text-error font-medium">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Calculating freight rates...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calculate Freight Rates
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 4. Trust Bar */}
      <section className="py-6 px-4 bg-bg-elevated/40 border-b border-border text-center">
        <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">
          19,277 Pincodes Enriched · NHAI Toll Integration · Multi-Modal Coverage
        </p>
      </section>

      {/* 5. Results Section */}
      {showResults && (
        <section id="results-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-bg-elevated/20 border-b border-border scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-fg">Calculation Results</h2>
            
            {/* Mode Tabs */}
            <ModeSelector activeMode={activeMode} onChangeMode={setActiveMode} />

            {/* Quote details */}
            {activeMode === 'all' ? (
              <QuoteResults
                mode="all"
                allQuotes={allQuotes}
                allBenchmarks={allBenchmarks}
              />
            ) : (
              <QuoteResults
                mode={activeMode as 'road' | 'air' | 'sea' | 'rail'}
                singleResult={allQuotes[activeMode]}
                singleBenchmark={allBenchmarks[activeMode]}
              />
            )}

            {/* Lead capture form */}
            <div className="mt-12 bg-card-custom border border-border rounded-xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-2">Request Verified Forwarder Quotes</h3>
              <p className="text-sm text-fg-muted mb-6">
                Send this shipment requirement to verified logistics providers to receive competing bookings.
              </p>

              {leadSuccess ? (
                <div className="bg-success/10 border border-success/20 p-6 rounded-lg text-center text-success space-y-2">
                  <Check className="w-8 h-8 mx-auto text-success" />
                  <h4 className="font-bold text-md">Request Submitted Successfully</h4>
                  <p className="text-xs text-success/80">Local logistics providers will reach out within 2 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Contact Name</label>
                      <input
                        type="text"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        required
                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        required
                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="+91 99999 99999"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Corporate Email</label>
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        required
                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Monthly Volume (Tons)</label>
                      <select
                        value={leadForm.volume}
                        onChange={(e) => setLeadForm({ ...leadForm, volume: e.target.value })}
                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="1-5">1-5 Tons</option>
                        <option value="5-20">5-20 Tons</option>
                        <option value="20-50">20-50 Tons</option>
                        <option value="50+">50+ Tons</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Submit Booking Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. Benefits (3-column grid) */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-elevated/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Engineered for Logistics Precision</h2>
            <p className="text-fg-muted text-sm max-w-2xl mx-auto">
              Our calculator uses official mapping databases and structural algorithms to remove estimates and hidden pricing variables.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="bg-card-custom border border-border p-6 rounded-xl space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-fg">{benefit.title}</h3>
                  <p className="text-sm text-fg-muted leading-relaxed">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Features (icon + title + desc, 4-column grid) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Technical Features</h2>
              <p className="text-sm text-fg-muted leading-relaxed">
                Unlock next-level capabilities with our unified API, smart parameters, and database integrations.
              </p>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="bg-bg-elevated/40 border border-border p-6 rounded-xl space-y-3">
                    <Icon className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-md text-fg">{feature.title}</h3>
                    <p className="text-sm text-fg-muted leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Comparison Table (You vs Competitors) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-elevated/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
            <p className="text-fg-muted text-sm">
              We focus purely on exact routing calculations and official fee schedules.
            </p>
          </div>
          <div className="bg-card-custom border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-border">
                <thead className="bg-bg/20 text-xs font-bold uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-6 py-4">Capability</th>
                    <th className="px-6 py-4 text-accent">FreightQuote</th>
                    <th className="px-6 py-4">Other Services</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-fg-muted font-medium">
                  <tr>
                    <td className="px-6 py-4 font-semibold text-fg">Pincode Autocomplete</td>
                    <td className="px-6 py-4 text-success flex items-center gap-2"><Check className="w-4 h-4" /> 19,277 Locations</td>
                    <td className="px-6 py-4">City-Level Only</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-fg">NHAI Toll Rates</td>
                    <td className="px-6 py-4 text-success flex items-center gap-2"><Check className="w-4 h-4" /> GPS Router Matched</td>
                    <td className="px-6 py-4">Manual Estimates</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-fg">Multi-Modal Calculations</td>
                    <td className="px-6 py-4 text-success flex items-center gap-2"><Check className="w-4 h-4" /> Road / Air / Sea / Rail</td>
                    <td className="px-6 py-4">Single Mode Only</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-fg">Reports & Exports</td>
                    <td className="px-6 py-4 text-success flex items-center gap-2"><Check className="w-4 h-4" /> PDF, XLS, CSV, JSON</td>
                    <td className="px-6 py-4">Screenshots Only</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-fg">REST API Integrations</td>
                    <td className="px-6 py-4 text-success flex items-center gap-2"><Check className="w-4 h-4" /> Out-of-the-box</td>
                    <td className="px-6 py-4">Not Available</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Flexible Subscription Tiers</h2>
            <p className="text-fg-muted text-sm">Transparent monthly packages with no contract commitments.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, idx) => (
              <div 
                key={idx} 
                className={`bg-card-custom border rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative ${
                  plan.highlight ? 'border-accent ring-1 ring-accent' : 'border-border'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-fg">{plan.name}</h3>
                  <p className="text-xs text-fg-muted mt-1 leading-relaxed">{plan.desc}</p>
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-fg">{plan.price}</span>
                    <span className="text-xs text-fg-muted">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-fg-muted">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a 
                  href="#calculator"
                  className={`w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer block border ${
                    plan.highlight 
                      ? 'bg-accent text-white hover:bg-accent-hover border-accent' 
                      : 'border-border text-fg hover:bg-bg-elevated'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-elevated/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Industry Experts</h2>
            <p className="text-fg-muted text-sm">Hear from freight managers and businesses scaling logistics operations in India.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-card-custom border border-border p-6 rounded-xl flex flex-col justify-between shadow-sm">
                <p className="text-sm italic text-fg-muted leading-relaxed mb-6">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-fg">{t.name}</h4>
                    <p className="text-[10px] text-fg-muted uppercase tracking-wider">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Integrations */}
      <section className="py-16 px-4 bg-bg-elevated/20 border-b border-border">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-xs uppercase font-bold text-fg-muted tracking-widest mb-8">Supported ERP & App Integrations</h3>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-fg-muted font-mono font-bold text-sm">
            <span>SAP ERP</span>
            <span>Oracle NetSuite</span>
            <span>Tally ERP</span>
            <span>Shiprocket</span>
            <span>Delhivery API</span>
            <span>WhatsApp Business</span>
          </div>
        </div>
      </section>

      {/* 12. FAQ (Accordion) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-fg-muted text-sm">Everything you need to know about the FreightQuote calculations.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "How accurate are the toll calculations?", a: "We match your route geometry to NHAI toll plaza coordinates (using a 2km search radius) and apply official rates per vehicle axle class. Road FTL confidence: 97%." },
              { q: "What parameters are used for Air Freight?", a: "We resolve the closest domestic airports from origin and destination pincodes using a great circle formula. Tariff rates are computed on chargeable weight using volumetric conversion metrics (1 CBM = 167 kg)." },
              { q: "What types of ocean containers are supported?", a: "We support standard 20ft GP, 40ft GP, 40ft HC and refrigerated Reefer variants (20ft RF, 40ft RF) for domestic sea transport matching ports like JNPT and Chennai." },
              { q: "How are Rail wagon estimates structured?", a: "We map consignments to nearest Inland Container Depots (ICD) and match cargo commodities to box classifications (BOXN open, BCN covered, BTPN tanker) using standard IRCTC freight haulage tariffs." },
              { q: "Is my corporate data protected?", a: "Yes, all calculation logic runs via secure sandboxed API endpoints. We restrict access via tailed tailscale network overlays or VPN basic auth middleware configs." },
              { q: "Can I integrate quotes in our accounting systems?", a: "Absolutely. Pro and Enterprise tiers expose REST endpoints. You can export quotes directly to PDF reports, Excel spreadsheets, CSV data tables, or raw JSON formats." }
            ].map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div key={idx} className="bg-bg-elevated/40 border border-border rounded-xl overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left font-bold text-sm text-fg hover:text-accent transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-accent" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-sm text-fg-muted leading-relaxed font-sans border-t border-border/30 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 13. Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-bg-elevated/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border-t border-border/50 pt-8 text-xs text-fg-muted">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Truck className="w-4 h-4 text-accent" />
            <span className="font-bold font-mono">FreightQuote.in</span>
          </div>
          <div className="flex gap-6 mb-4 md:mb-0">
            <a href="#calculator" className="hover:text-fg transition-colors">Calculator</a>
            <a href="#features" className="hover:text-fg transition-colors">Features</a>
            <a href="#pricing" className="hover:text-fg transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-fg transition-colors">FAQ</a>
          </div>
          <span>&copy; {new Date().getFullYear()} FreightQuote India. Private enterprise logistics system. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}