/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, ArrowRight, AlertCircle, ThumbsUp, 
  Download, CreditCard, Plus, Edit2, Trash2, ChevronLeft,
  ChevronRight, LayoutGrid, Settings, FileSpreadsheet, Loader2,
  BarChart2, Calculator, ChevronDown, Copy, CheckSquare, RefreshCw, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { Lead, Forwarder, Invoice, ForwarderRate } from '../../lib/db';
import { springStandard, springMagnetic } from '@/lib/animations/variants';
import { CalculatorWidget } from '@/components/dashboard/CalculatorWidget';
import { PincodeAutocomplete } from '@/components/PincodeAutocomplete';
import { QuoteResults } from '@/components/QuoteResults';
import { SearchableCommodity } from '@/components/SearchableCommodity';
import { QuoteResult, Benchmark } from '@/lib/types';
import { TransportMode } from '@/components/ModeSelector';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  const [role, setRole] = useState<'admin' | 'forwarder'>('admin');
  const [selectedForwarderId, setSelectedForwarderId] = useState<string>('fwd-safexpress');
  
  // Database States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Tab states
  const [adminTab, setAdminTab] = useState<'leads' | 'forwarders' | 'billing' | 'calculator'>('leads');
  const [forwarderTab, setForwarderTab] = useState<'pipeline' | 'ratecard' | 'billing'>('pipeline');

  // Calculator Integration States
  const [calcActiveMode, setCalcActiveMode] = useState<TransportMode>('all');
  const [calcOrigin, setCalcOrigin] = useState('400001');
  const [calcDest, setCalcDest] = useState('110001');
  const [calcWeight, setCalcWeight] = useState('10000');
  const [calcCommodity, setCalcCommodity] = useState('general');
  const [calcVehicle, setCalcVehicle] = useState('auto');
  const [calcContainerType, setCalcContainerType] = useState('auto');
  const [calcIncoterm, setCalcIncoterm] = useState('EXW');
  const [calcCargoValue, setCalcCargoValue] = useState('');
  const [calcDimensions, setCalcDimensions] = useState({ length: '', width: '', height: '' });
  const [calcShowAdvanced, setCalcShowAdvanced] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calcShowResults, setCalcShowResults] = useState(false);
  const [calcAllQuotes, setCalcAllQuotes] = useState<Record<string, QuoteResult & { error?: string }>>({});
  const [calcAllBenchmarks, setCalcAllBenchmarks] = useState<Record<string, Benchmark>>({});
  const [calcShowHelpModal, setCalcShowHelpModal] = useState(false);
  const [calcCopiedLink, setCalcCopiedLink] = useState(false);
  
  // UI Interaction States
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [bidForm, setBidForm] = useState<{ leadId: string; amount: string; transitDays: string; remarks: string } | null>(null);
  
  // Rate Cards Inline Edit
  const [editRateIdx, setEditRateIdx] = useState<number | null>(null);
  const [tempBasePrice, setTempBasePrice] = useState<string>('');
  const [tempPricePerKg, setTempPricePerKg] = useState<string>('');
  
  const [showAddRate, setShowAddRate] = useState(false);
  const [newRate, setNewRate] = useState<ForwarderRate>({
    originState: 'MAHARASHTRA',
    destState: 'DELHI',
    mode: 'road',
    basePrice: 10000,
    pricePerKg: 5
  });

  const activeForwarder = forwarders.find(f => f.id === selectedForwarderId);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const [leadsRes, forwardersRes] = await Promise.all([
        fetch('/api/leads', { headers: { Authorization: authHeader } }),
        fetch('/api/forwarders', { headers: { Authorization: authHeader } })
      ]);
      
      const leadsData = await leadsRes.json();
      const fwdData = await forwardersRes.json();

      if (leadsData.success) {
        setLeads(leadsData.leads);
      }
      if (fwdData.success) {
        setForwarders(fwdData.forwarders);
        setInvoices(fwdData.invoices);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCalcCalculate = useCallback(async () => {
    setCalcLoading(true);
    setCalcError(null);
    setCalcShowResults(false);

    try {
      const payload = {
        originPincode: calcOrigin,
        destPincode: calcDest,
        weightKg: Number(calcWeight),
        commodity: calcCommodity,
        valueInr: calcCargoValue ? Number(calcCargoValue) : undefined,
        dimensions: (calcDimensions.length && calcDimensions.width && calcDimensions.height) ? {
          length: Number(calcDimensions.length),
          width: Number(calcDimensions.width),
          height: Number(calcDimensions.height)
        } : undefined,
        vehicleType: calcVehicle === 'auto' ? undefined : calcVehicle as any,
        containerType: calcContainerType === 'auto' ? undefined : calcContainerType as any,
        incoterm: calcIncoterm as any,
      };

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
      setCalcAllQuotes(data.quotes || {});
      setCalcAllBenchmarks(data.benchmarks || {});
      setCalcShowResults(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Calculation failed. Please verify inputs.';
      setCalcError(errMsg);
    } finally {
      setCalcLoading(false);
    }
  }, [calcOrigin, calcDest, calcWeight, calcCommodity, calcVehicle, calcCargoValue, calcDimensions, calcContainerType, calcIncoterm]);

  const handleCalcClear = useCallback(() => {
    setCalcOrigin('');
    setCalcDest('');
    setCalcWeight('10000');
    setCalcCargoValue('');
    setCalcDimensions({ length: '', width: '', height: '' });
    setCalcError(null);
    setCalcShowResults(false);
  }, []);

  const handleCalcCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/calculate');
    setCalcCopiedLink(true);
    setTimeout(() => setCalcCopiedLink(false), 2000);
  };

  // Keyboard Shortcuts Hook for Calculator Tab
  useEffect(() => {
    if (adminTab !== 'calculator') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to Calculate (allowed even when input focused)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCalcCalculate();
        return;
      }

      // Check if user is typing inside an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Cmd+Shift+C to Clear
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCalcClear();
      }

      // 1-4 for Mode Switcher
      if (['1', '2', '3', '4'].includes(e.key)) {
        const modesMap: Record<string, TransportMode> = {
          '1': 'all',
          '2': 'road',
          '3': 'air',
          '4': 'sea'
        };
        setCalcActiveMode(modesMap[e.key]);
      }

      // ? or h for Help Modal
      if (e.key === '?' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setCalcShowHelpModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminTab, handleCalcCalculate, handleCalcClear]);

  useEffect(() => {
    const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith('auth='));
    if (!hasCookie) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();

    // SSE Bidding Live Stream Connection
    const eventSource = new EventSource('/api/bids/stream');

    eventSource.addEventListener('new-bid', (event) => {
      try {
        const bid = JSON.parse(event.data);

        setLeads((prevLeads) => {
          // Find first lead in Contacted or New state to apply the bid
          const targetLead = prevLeads.find(l => 
            (l.status === 'Contacted' || l.status === 'New') && 
            !l.bids.some(b => b.forwarderId === bid.forwarderId)
          );

          if (targetLead) {
            const updatedBids = [...targetLead.bids, bid];
            const nextStatus = targetLead.status === 'Contacted' ? 'Quoted' : targetLead.status;
            
            return prevLeads.map(l => 
              l.id === targetLead.id 
                ? { ...l, bids: updatedBids, status: nextStatus as any } 
                : l
            );
          }
          return prevLeads;
        });
      } catch (err) {
        console.error("Error parsing live SSE bid", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

  // Submit Bid
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidForm) return;

    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const res = await fetch('/api/forwarders/bid', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          leadId: bidForm.leadId,
          forwarderId: selectedForwarderId,
          amount: Number(bidForm.amount),
          transitDays: Number(bidForm.transitDays),
          remarks: bidForm.remarks
        })
      });

      const data = await res.json();
      if (data.success) {
        setBidForm(null);
        await fetchData(); // refresh
      } else {
        alert(data.error || 'Failed to submit bid');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting bid');
    }
  };

  const autoCalculateBid = (lead: Lead) => {
    if (!activeForwarder) return;
    
    const rate = activeForwarder.rateCard.find(r => 
      r.originState.toUpperCase() === lead.originState.toUpperCase() &&
      r.destState.toUpperCase() === lead.destState.toUpperCase() &&
      r.mode === lead.mode
    );

    if (rate) {
      const calculatedAmount = rate.basePrice + (rate.pricePerKg * lead.weightKg);
      setBidForm({
        leadId: lead.id,
        amount: Math.round(calculatedAmount).toString(),
        transitDays: lead.mode === 'road' ? '3' : lead.mode === 'air' ? '1' : lead.mode === 'sea' ? '14' : '5',
        remarks: 'Auto-calculated from lane rate card'
      });
    } else {
      alert(`No rate card lane matched for ${lead.originState} -> ${lead.destState} (${lead.mode.toUpperCase()}). Please input bid manually.`);
    }
  };

  // Change Status Pipeline
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const res = await fetch('/api/forwarders/status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          leadId,
          status: newStatus,
          forwarderId: selectedForwarderId
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  // Accept Forwarder Bid
  const handleAcceptBid = async (leadId: string, fwdId: string) => {
    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const res = await fetch('/api/forwarders/status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          leadId,
          status: 'Won',
          forwarderId: fwdId
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save/Update Rate Card
  const saveRateCard = async (updatedRates: ForwarderRate[]) => {
    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const res = await fetch('/api/forwarders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          forwarderId: selectedForwarderId,
          rateCard: updatedRates
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditRateIdx(null);
        setShowAddRate(false);
        await fetchData();
      } else {
        alert(data.error || 'Failed to save rates');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving rates');
    }
  };

  const handleStartEditRate = (idx: number, rate: ForwarderRate) => {
    setEditRateIdx(idx);
    setTempBasePrice(rate.basePrice.toString());
    setTempPricePerKg(rate.pricePerKg.toString());
  };

  const handleSaveInlineRate = (idx: number) => {
    if (!activeForwarder) return;
    const updated = activeForwarder.rateCard.map((rate, i) => {
      if (i === idx) {
        return {
          ...rate,
          basePrice: Number(tempBasePrice),
          pricePerKg: Number(tempPricePerKg)
        };
      }
      return rate;
    });
    saveRateCard(updated);
  };

  const handleAddRate = () => {
    if (!activeForwarder) return;
    const updated = [...activeForwarder.rateCard, newRate];
    saveRateCard(updated);
  };

  const handleDeleteRate = (idx: number) => {
    if (!activeForwarder) return;
    if (!confirm('Are you sure you want to delete this rate lane?')) return;
    const updated = activeForwarder.rateCard.filter((_, i) => i !== idx);
    saveRateCard(updated);
  };

  // Pay Invoice via Razorpay Sandbox
  const handleInvoicePay = async (invoiceId: string) => {
    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const res = await fetch('/api/forwarders/invoice-pay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ invoiceId })
      });

      const data = await res.json();
      if (data.success) {
        await fetchData();
        alert('Payment processed successfully via Razorpay test mode!');
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing payment');
    }
  };

  // Generate PDF Invoice
  const downloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FREIGHT PLATFORM INDIA', 14, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('GSTIN: 27AAACF9021K1Z3', 14, 29);
    
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 50);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Invoice ID: ${invoice.id.toUpperCase()}`, 14, 60);
    doc.text(`Billing Month: ${invoice.month}`, 14, 65);
    doc.text(`Date of Issue: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 70);
    doc.text(`Payment Status: ${invoice.status.toUpperCase()}`, 14, 75);

    const forwarder = forwarders.find(f => f.id === invoice.forwarderId);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 120, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.forwarderName, 120, 55);
    doc.text(`GSTIN: ${forwarder?.gstin || 'N/A'}`, 120, 60);
    doc.text('India Cargo Network Partner', 120, 65);

    const tableData = [
      ['Qualified Marketplace Lead Generation Fees', `${invoice.leadsCount} leads`, `INR ${invoice.subtotal.toLocaleString('en-IN')}`],
      ['CGST @ 9%', '', `INR ${invoice.cgst.toLocaleString('en-IN')}`],
      ['SGST @ 9%', '', `INR ${invoice.sgst.toLocaleString('en-IN')}`],
      ['Grand Total', '', `INR ${invoice.total.toLocaleString('en-IN')}`]
    ];

    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Quantity', 'Amount (INR)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      columnStyles: {
        2: { halign: 'right' }
      }
    });

    doc.save(`invoice-${invoice.id}.pdf`);
  };

  const isSlaBreached = (lead: Lead) => {
    if (lead.status !== 'New') return false;
    const hoursElapsed = (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 2;
  };

  // Drag and Drop Kanban end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    
    handleStatusChange(leadId, newStatus);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">
            {!isAuthenticated ? 'Verifying credentials...' : 'Loading Command Center...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f8fafc] flex font-sans antialiased overflow-hidden">
      
      {/* Sidebar (collapsible spring) */}
      <motion.aside 
        animate={{ width: isSidebarExpanded ? 280 : 72 }}
        transition={springStandard}
        className="bg-black border-r border-white/5 flex flex-col justify-between z-30"
      >
        <div className="space-y-8 py-6">
          <div className="px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              {isSidebarExpanded && (
                <span className="font-bold text-xs uppercase tracking-wider text-white">Freight Intel</span>
              )}
            </div>
            {isSidebarExpanded && (
              <button 
                onClick={() => setIsSidebarExpanded(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="space-y-1.5 px-3">
            <button 
              onClick={() => { if (role === 'admin') setAdminTab('leads'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                adminTab === 'leads' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span>Leads Hub</span>}
            </button>
            
            <Link 
              href="/dashboard/analytics" 
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <BarChart2 className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span>Analytics & BI</span>}
            </Link>

            <button 
              onClick={() => { if (role === 'admin') setAdminTab('forwarders'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                adminTab === 'forwarders' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span>Rate Cards</span>}
            </button>

            <button 
              onClick={() => { if (role === 'admin') setAdminTab('billing'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                adminTab === 'billing' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span>Invoices</span>}
            </button>

            <button 
              onClick={() => { if (role === 'admin') setAdminTab('calculator'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                adminTab === 'calculator' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span>Calculator Tool</span>}
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-400 hover:text-white transition-all">
              <Settings className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span>Settings</span>}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/5">
          {!isSidebarExpanded && (
            <button 
              onClick={() => setIsSidebarExpanded(true)}
              className="w-full py-2 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {isSidebarExpanded && (
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-[10px] space-y-1">
              <div className="font-bold text-slate-400 uppercase">Gateway Active</div>
              <div className="text-slate-500">Live SSE Feed Synchronised</div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Panel Content */}
      <main className="flex-1 overflow-y-auto min-h-screen flex flex-col relative">
        
        {/* Header bar */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-white">Marketplace Control</h1>
            <p className="text-[10px] text-slate-400 uppercase mt-0.5">Real-time logistics pricing dashboard</p>
          </div>

          <div className="flex items-center gap-6">
            {role === 'forwarder' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Simulate Partner:</span>
                <select
                  value={selectedForwarderId}
                  onChange={(e) => setSelectedForwarderId(e.target.value)}
                  className="bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                >
                  {forwarders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}

            {/* Role switcher pill */}
            <div className="relative bg-white/5 p-1 rounded-xl border border-white/5 flex overflow-hidden">
              <button
                onClick={() => setRole('admin')}
                className="relative z-10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
              >
                {role === 'admin' && (
                  <motion.div
                    layoutId="roleTabPill"
                    transition={springMagnetic}
                    className="absolute inset-0 bg-gradient-accent rounded-lg shadow z-[-1]"
                  />
                )}
                <span className={role === 'admin' ? 'text-white' : ''}>Platform Admin</span>
              </button>
              <button
                onClick={() => setRole('forwarder')}
                className="relative z-10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
              >
                {role === 'forwarder' && (
                  <motion.div
                    layoutId="roleTabPill"
                    transition={springMagnetic}
                    className="absolute inset-0 bg-gradient-accent rounded-lg shadow z-[-1]"
                  />
                )}
                <span className={role === 'forwarder' ? 'text-white' : ''}>Forwarder</span>
              </button>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 transition-all rounded-xl cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Grid Layout: main view + widget side panel */}
        {adminTab === 'calculator' ? (
          <div className="flex-1 flex flex-col lg:flex-row items-stretch z-10 relative overflow-hidden h-[calc(100vh-80px)]">
            
            {/* ZONE 1 (LEFT 35%): Sticky Input Panel */}
            <div className="lg:w-[35%] border-r border-white/5 bg-black/85 backdrop-blur-3xl overflow-y-auto p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-white font-display">Calculators Parameters</h2>
                  <button
                    onClick={handleCalcClear}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Reset Override
                  </button>
                </div>

                {/* Inputs */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PincodeAutocomplete
                      label="Origin Pincode"
                      value={calcOrigin}
                      onChange={setCalcOrigin}
                      placeholder="e.g. 400001 (Mumbai)"
                    />
                    <PincodeAutocomplete
                      label="Destination Pincode"
                      value={calcDest}
                      onChange={setCalcDest}
                      placeholder="e.g. 110001 (Delhi)"
                    />
                  </div>

                  {/* Weight Slider widget */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Cargo Weight (kg)</span>
                      <span className="font-mono text-white">{(Number(calcWeight)/1000).toFixed(1)} Tons</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="50000"
                      step="100"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <input
                      type="number"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>

                  {/* Commodity Search dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Commodity Class</label>
                    <SearchableCommodity
                      value={calcCommodity}
                      onChange={setCalcCommodity}
                      placeholder="Search class..."
                    />
                  </div>

                  {/* Advanced collapsibles */}
                  <div className="border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => setCalcShowAdvanced(!calcShowAdvanced)}
                      className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white"
                    >
                      <span>Advanced Parameters</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${calcShowAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    {calcShowAdvanced && (
                      <div className="mt-4 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cargo Value (INR)</label>
                            <input
                              type="number"
                              value={calcCargoValue}
                              onChange={(e) => setCalcCargoValue(e.target.value)}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                              placeholder="Insurance limit"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Incoterms</label>
                            <select
                              value={calcIncoterm}
                              onChange={(e) => setCalcIncoterm(e.target.value)}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                            >
                              {['EXW', 'FOB', 'CIF', 'CFR'].map(inc => <option key={inc} value={inc}>{inc}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preferred FTL</label>
                            <select
                              value={calcVehicle}
                              onChange={(e) => setCalcVehicle(e.target.value)}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                            >
                              {[{ code: 'auto', name: 'Auto-Select' }, { code: '16T', name: '16 Ton' }, { code: '25T', name: '25 Ton' }, { code: '40T', name: '40 Ton' }].map(v => <option key={v.code} value={v.code}>{v.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sea Container</label>
                            <select
                              value={calcContainerType}
                              onChange={(e) => setCalcContainerType(e.target.value)}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                            >
                              {[{ code: 'auto', name: 'Auto-Select' }, { code: '20ft_GP', name: '20ft General' }, { code: '40ft_GP', name: '40ft General' }].map(ct => <option key={ct.code} value={ct.code}>{ct.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trigger button */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                {calcError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                    {calcError}
                  </div>
                )}
                
                <button
                  onClick={handleCalcCalculate}
                  disabled={calcLoading}
                  className="w-full py-4 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
                >
                  {calcLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running Engine Matrix...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Evaluate Freight Rates
                    </span>
                  )}
                </button>
                <div className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Press Cmd+Enter to run calculations
                </div>
              </div>
            </div>

            {/* ZONE 2 (CENTER 40%): Results Display */}
            <div className="lg:w-[40%] border-r border-white/5 bg-slate-950/20 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Calculation Output</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCalcCopyLink}
                      className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy quote link"
                    >
                      {calcCopiedLink ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Mode switch for detailed results */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {(['all', 'road', 'air'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setCalcActiveMode(m)}
                      className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        calcActiveMode === m ? 'bg-gradient-accent text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m === 'all' ? 'All Modes' : m === 'road' ? 'Road FTL' : 'Air Cargo'}
                    </button>
                  ))}
                </div>

                {/* Dynamic Results Display */}
                {calcShowResults ? (
                  <div className="space-y-6 animate-fade-in">
                    {calcActiveMode === 'all' ? (
                      <QuoteResults
                        mode="all"
                        allQuotes={calcAllQuotes}
                        allBenchmarks={calcAllBenchmarks}
                      />
                    ) : (
                      <QuoteResults
                        mode={calcActiveMode as 'road' | 'air' | 'sea' | 'rail'}
                        singleResult={calcAllQuotes[calcActiveMode]}
                        singleBenchmark={calcAllBenchmarks[calcActiveMode]}
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-glass rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 h-[320px]">
                    <Calculator className="w-8 h-8 opacity-40 animate-pulse text-cyan-400" />
                    <p className="text-xs uppercase font-bold tracking-wider leading-relaxed text-slate-300">
                      Awaiting Sourcing Inputs
                    </p>
                    <p className="text-[10px] text-slate-500">Configure lanes and weight on the left panel to evaluate live rates.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ZONE 3 (RIGHT 25%): Live Carrier Benchmarks */}
            <div className="lg:w-[25%] bg-black/85 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Carrier Benchmarks</h2>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-1">Live market comparison rates</p>
                </div>

                {calcShowResults ? (
                  <div className="space-y-4 animate-fade-in">
                    {(calcActiveMode === 'all' || calcActiveMode === 'road') && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Road FTL Carriers</div>
                        {[
                          { name: 'Blue Dart FTL', rate: calcAllQuotes.road ? Math.round(calcAllQuotes.road.total * 1.12) : 20160, days: 4, type: 'Premium' },
                          { name: 'Safexpress', rate: calcAllQuotes.road ? Math.round(calcAllQuotes.road.total * 1.04) : 18720, days: 5, type: 'Standard' },
                          { name: 'Gati KWE FTL', rate: calcAllQuotes.road ? Math.round(calcAllQuotes.road.total * 0.94) : 16920, days: 6, type: 'Budget' }
                        ].map((c, i) => (
                          <div key={i} className="bg-glass border border-white/5 p-4 rounded-xl space-y-2 hover:border-cyan-400/20 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-white">{c.name}</div>
                                <div className="text-[9px] text-slate-500 font-mono mt-0.5">{c.type} • {c.days} days</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-cyan-400 font-mono">₹{c.rate.toLocaleString('en-IN')}</div>
                                <div className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">Est. Quote</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(calcActiveMode === 'all' || calcActiveMode === 'air') && (
                      <div className="space-y-3 pt-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Air Express Carriers</div>
                        {[
                          { name: 'SpiceXpress', rate: calcAllQuotes.air ? Math.round(calcAllQuotes.air.total * 0.95) : 42750, days: 1, type: 'Value Cargo' },
                          { name: 'IndiGo CarGo', rate: calcAllQuotes.air ? Math.round(calcAllQuotes.air.total * 1.03) : 46350, days: 1, type: 'Standard' },
                          { name: 'DHL Express India', rate: calcAllQuotes.air ? Math.round(calcAllQuotes.air.total * 1.25) : 56250, days: 1, type: 'Premium Express' }
                        ].map((c, i) => (
                          <div key={i} className="bg-glass border border-white/5 p-4 rounded-xl space-y-2 hover:border-cyan-400/20 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-white">{c.name}</div>
                                <div className="text-[9px] text-slate-500 font-mono mt-0.5">{c.type} • {c.days} day</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-cyan-400 font-mono">₹{c.rate.toLocaleString('en-IN')}</div>
                                <div className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">Est. Quote</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-glass border border-dashed border-white/5 rounded-xl p-6 text-center text-slate-600 h-[240px] flex flex-col items-center justify-center space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider">No Benchmarks Compiled</p>
                    <p className="text-[9px] text-slate-500 max-w-[180px] mx-auto">Carrier rates compile dynamically once the calculation matrix runs.</p>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={() => setAdminTab('leads')}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  <span>Return to Leads Pipeline</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Help modal */}
            <AnimatePresence>
              {calcShowHelpModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    transition={springStandard}
                    className="bg-black border border-white/10 rounded-organic-2 p-8 max-w-sm w-full space-y-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white font-display">Keyboard Control Center</h3>
                      <button onClick={() => setCalcShowHelpModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4 text-xs font-mono text-slate-300">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Calculate Rates</span>
                        <span className="text-cyan-400">Cmd + Enter</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Reset Overrides</span>
                        <span className="text-cyan-400">Cmd+Shift+C</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>All Modes view</span>
                        <span className="text-cyan-400">1</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Road Freight</span>
                        <span className="text-cyan-400">2</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Air Freight</span>
                        <span className="text-cyan-400">3</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Sea Freight</span>
                        <span className="text-cyan-400">4</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Open Help Menu</span>
                        <span className="text-cyan-400">? / H</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCalcShowHelpModal(false)}
                      className="w-full py-2.5 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      Close documentation
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-3 space-y-8">
            {role === 'admin' && (
              <div className="space-y-8">
                {/* Tabs */}
                <div className="flex border-b border-white/5 gap-2">
                  {(['leads', 'forwarders', 'billing'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setAdminTab(tab)}
                      className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        adminTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === 'leads' && "Leads Pipeline"}
                      {tab === 'forwarders' && "Forwarder Directory"}
                      {tab === 'billing' && "Billing & Invoices"}
                    </button>
                  ))}
                </div>

                {/* Admin Tab 1: Leads Pipeline (Kanban with drag-and-drop) */}
                {adminTab === 'leads' && (
                  <div className="space-y-6">
                    <DndContext onDragEnd={handleDragEnd}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                        <DroppableColumn id="New" title="New requests" leads={leads.filter(l => l.status === 'New')} />
                        <DroppableColumn id="Contacted" title="Contacted" leads={leads.filter(l => l.status === 'Contacted')} />
                        <DroppableColumn id="Quoted" title="Quoted" leads={leads.filter(l => l.status === 'Quoted')}>
                          {leads.filter(l => l.status === 'Quoted').map(lead => (
                            <DraggableCard key={lead.id} id={lead.id} lead={lead}>
                              <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">Bids Received</span>
                                {lead.bids.map((b, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-[10px]">
                                    <div>
                                      <div>{b.forwarderName}</div>
                                      <div className="font-mono text-cyan-400 font-bold">INR {b.amount.toLocaleString('en-IN')}</div>
                                    </div>
                                    <button
                                      onClick={() => handleAcceptBid(lead.id, b.forwarderId)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </DraggableCard>
                          ))}
                        </DroppableColumn>
                        <DroppableColumn id="Won" title="Won" leads={leads.filter(l => l.status === 'Won')}>
                          {leads.filter(l => l.status === 'Won').map(lead => (
                            <div key={lead.id} className="p-4 bg-black border border-emerald-500/20 rounded-xl space-y-3 hover:border-emerald-400/40 transition-all shadow-md shadow-emerald-500/5">
                              <h4 className="text-xs font-bold text-white leading-tight">{lead.company}</h4>
                              <div className="text-[10px] text-slate-500 font-mono">Lane: {lead.originState} &rarr; {lead.destState}</div>
                              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                                <ThumbsUp className="w-3.5 h-3.5" />
                                Accepted Win
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-white">INR {lead.calculatedCost.toLocaleString('en-IN')}</span>
                                <span className="text-[9px] text-slate-500">Won</span>
                              </div>
                            </div>
                          ))}
                        </DroppableColumn>
                      </div>
                    </DndContext>
                  </div>
                )}

                {/* Admin Tab 2: Forwarder Management */}
                {adminTab === 'forwarders' && (
                  <div className="bg-glass border border-white/5 rounded-organic-2 p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Logistics Providers Directory</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Covered States</th>
                            <th className="pb-3">GSTIN</th>
                            <th className="pb-3">Rates</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {forwarders.map(f => (
                            <tr key={f.id} className="hover:bg-white/[0.01]">
                              <td className="py-4 font-bold text-white">{f.name}</td>
                              <td className="py-4 text-slate-300">{f.coveredLanes.join(', ')}</td>
                              <td className="py-4 font-mono text-slate-400">{f.gstin}</td>
                              <td className="py-4 text-slate-400">{f.rateCard.length} active lanes</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Admin Tab 3: Billing & Invoices */}
                {adminTab === 'billing' && (
                  <div className="bg-glass border border-white/5 rounded-organic-1 p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">B2B Partner Invoices</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="pb-3">Billing Partner</th>
                            <th className="pb-3">Billing Month</th>
                            <th className="pb-3">Leads Count</th>
                            <th className="pb-3">Total Amount</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {invoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-white/[0.01]">
                              <td className="py-4 font-bold text-white">{invoice.forwarderName}</td>
                              <td className="py-4 text-slate-300 font-mono">{invoice.month}</td>
                              <td className="py-4 text-slate-400">{invoice.leadsCount}</td>
                              <td className="py-4 font-mono text-cyan-400 font-bold">INR {invoice.total.toLocaleString('en-IN')}</td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="py-4 flex items-center gap-3">
                                <button
                                  onClick={() => downloadInvoice(invoice)}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                  title="Download GST PDF Invoice"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === 'forwarder' && (
              <div className="space-y-8 animate-fade-in">
                {/* Tabs */}
                <div className="flex border-b border-white/5 gap-2">
                  {(['pipeline', 'ratecard', 'billing'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setForwarderTab(tab)}
                      className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        forwarderTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === 'pipeline' && "Opportunity Pipeline"}
                      {tab === 'ratecard' && "Rate Matrix Editor"}
                      {tab === 'billing' && "Partner Settlement"}
                    </button>
                  ))}
                </div>

                {/* Forwarder Tab 1: Opportunity Pipeline */}
                {forwarderTab === 'pipeline' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-glass border border-white/5 rounded-organic-1 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Open Shipments Available</h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {leads.filter(l => l.status === 'New' || l.status === 'Contacted').map(lead => {
                            const isBidPlaced = lead.bids.some(b => b.forwarderId === selectedForwarderId);
                            return (
                              <div key={lead.id} className="p-4 bg-black/60 border border-white/5 rounded-xl space-y-3">
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{lead.mode} FTL</span>
                                  {isBidPlaced && (
                                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                      Bid Active
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-white">{lead.company}</h4>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Lane: {lead.originState} &rarr; {lead.destState} | Cargo: {lead.weightKg} kg
                                </div>
                                <div className="flex gap-2 pt-2">
                                  {!isBidPlaced && (
                                    <>
                                      <button
                                        onClick={() => autoCalculateBid(lead)}
                                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                      >
                                        Auto-Price Bid
                                      </button>
                                      <button
                                        onClick={() => setBidForm({ leadId: lead.id, amount: '', transitDays: '', remarks: '' })}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                      >
                                        Manual Bid
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Manual bidding form overlay */}
                      {bidForm && (
                        <div className="bg-glass border border-white/5 rounded-organic-2 p-6 space-y-4 h-fit">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configure Marketplace Bid</h3>
                          <form onSubmit={handleBidSubmit} className="space-y-4">
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Bid Amount (INR)</label>
                              <input
                                type="number"
                                required
                                value={bidForm.amount}
                                onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Transit Time (Days)</label>
                              <input
                                type="number"
                                required
                                value={bidForm.transitDays}
                                onChange={(e) => setBidForm({ ...bidForm, transitDays: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Remarks</label>
                              <input
                                type="text"
                                value={bidForm.remarks}
                                onChange={(e) => setBidForm({ ...bidForm, remarks: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                Submit Bid
                              </button>
                              <button
                                type="button"
                                onClick={() => setBidForm(null)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Forwarder Tab 2: Rate Card Matrix */}
                {forwarderTab === 'ratecard' && activeForwarder && (
                  <div className="bg-glass border border-white/5 rounded-organic-2 p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Partner Lane Pricing Matrix</h3>
                      <button
                        onClick={() => setShowAddRate(true)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Pricing Lane
                      </button>
                    </div>

                    {showAddRate && (
                      <div className="bg-black/60 border border-white/5 rounded-xl p-4 grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Origin</label>
                          <input
                            type="text"
                            value={newRate.originState}
                            onChange={(e) => setNewRate({ ...newRate, originState: e.target.value.toUpperCase() })}
                            className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Destination</label>
                          <input
                            type="text"
                            value={newRate.destState}
                            onChange={(e) => setNewRate({ ...newRate, destState: e.target.value.toUpperCase() })}
                            className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Base Price</label>
                          <input
                            type="number"
                            value={newRate.basePrice}
                            onChange={(e) => setNewRate({ ...newRate, basePrice: Number(e.target.value) })}
                            className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Per Kg Price</label>
                          <input
                            type="number"
                            value={newRate.pricePerKg}
                            onChange={(e) => setNewRate({ ...newRate, pricePerKg: Number(e.target.value) })}
                            className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddRate}
                            className="px-3 py-2 bg-gradient-accent text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowAddRate(false)}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="pb-3">Origin</th>
                            <th className="pb-3">Destination</th>
                            <th className="pb-3">Mode</th>
                            <th className="pb-3">Base Price</th>
                            <th className="pb-3">Per Kg Price</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {activeForwarder.rateCard.map((rate, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01]">
                              <td className="py-4 font-bold text-white">{rate.originState}</td>
                              <td className="py-4 text-slate-300">{rate.destState}</td>
                              <td className="py-4 text-slate-400 uppercase">{rate.mode}</td>
                              <td className="py-4">
                                {editRateIdx === idx ? (
                                  <input
                                    type="number"
                                    value={tempBasePrice}
                                    onChange={(e) => setTempBasePrice(e.target.value)}
                                    className="bg-black border border-cyan-400 rounded px-2 py-1 text-xs text-white outline-none w-20 font-mono"
                                  />
                                ) : (
                                  <span className="font-mono">INR {rate.basePrice.toLocaleString('en-IN')}</span>
                                )}
                              </td>
                              <td className="py-4">
                                {editRateIdx === idx ? (
                                  <input
                                    type="number"
                                    value={tempPricePerKg}
                                    onChange={(e) => setTempPricePerKg(e.target.value)}
                                    className="bg-black border border-cyan-400 rounded px-2 py-1 text-xs text-white outline-none w-16 font-mono"
                                  />
                                ) : (
                                  <span className="font-mono">INR {rate.pricePerKg}</span>
                                )}
                              </td>
                              <td className="py-4">
                                {editRateIdx === idx ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveInlineRate(idx)}
                                      className="text-emerald-400 hover:text-emerald-300 font-bold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditRateIdx(null)}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleStartEditRate(idx, rate)}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRate(idx)}
                                      className="text-rose-400 hover:text-rose-300"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Forwarder Tab 3: Billing Settled */}
                {forwarderTab === 'billing' && (
                  <div className="bg-glass border border-white/5 rounded-organic-1 p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Settlement & GST Invoices</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="pb-3">Billing Month</th>
                            <th className="pb-3">Qualified Leads</th>
                            <th className="pb-3">Subtotal</th>
                            <th className="pb-3">GST Total</th>
                            <th className="pb-3">Grand Total</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {invoices.filter(i => i.forwarderId === selectedForwarderId).map(invoice => (
                            <tr key={invoice.id} className="hover:bg-white/[0.01]">
                              <td className="py-4 font-bold text-white">{invoice.month}</td>
                              <td className="py-4 text-slate-300 font-mono">{invoice.leadsCount}</td>
                              <td className="py-4 text-slate-400 font-mono">INR {invoice.subtotal.toLocaleString('en-IN')}</td>
                              <td className="py-4 text-slate-400 font-mono">INR {(invoice.cgst + invoice.sgst).toLocaleString('en-IN')}</td>
                              <td className="py-4 font-mono text-cyan-400 font-bold">INR {invoice.total.toLocaleString('en-IN')}</td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="py-4 flex items-center gap-3">
                                <button
                                  onClick={() => downloadInvoice(invoice)}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                  title="Download GST Invoice"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {invoice.status === 'Unpaid' && (
                                  <button
                                    onClick={() => handleInvoicePay(invoice.id)}
                                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[9px] uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Pay Now
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick calculator and helper widget side panel */}
          <div className="lg:col-span-1 space-y-8">
            <CalculatorWidget />
            
            {/* Live SSE bids console */}
            <div className="bg-glass border border-white/5 rounded-organic-2 p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Bidding Engine</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase">
                Incoming pricing bids will update the opportunity matrix dynamically. Drag leads between columns to update status.
              </p>
              
              <div className="space-y-3 pt-2 max-h-[220px] overflow-y-auto">
                <AnimatePresence>
                  {leads.flatMap(l => l.bids).sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 4).map((b, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1"
                    >
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                        <span>{b.forwarderName}</span>
                        <span className="font-mono">{new Date(b.submittedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-cyan-400 font-mono font-bold">INR {b.amount.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{b.transitDays} Days</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      )}

      </main>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ id, title, leads, children }: { id: string; title: string; leads: Lead[]; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-glass rounded-organic-1 p-5 flex flex-col space-y-4 transition-colors duration-200 ${
        isOver ? 'bg-cyan-500/[0.03] border-cyan-400/20' : 'border border-white/5'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-white/5">
        <span>{title}</span>
        <span className="bg-white/5 px-2 py-0.5 rounded-full text-white">
          {leads.length}
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
        {children ? children : leads.map(lead => (
          <DraggableCard key={lead.id} id={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

// Draggable Card Component
function DraggableCard({ id, lead, children }: { id: string; lead: Lead; children?: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const hoursElapsed = (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
  const hasSlaBreach = lead.status === 'New' && hoursElapsed > 2;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-black border rounded-xl space-y-3 transition-all ${
        isDragging ? 'opacity-40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/5 hover:border-cyan-400/30'
      } ${
        hasSlaBreach ? 'border-rose-600/40 shadow-lg shadow-rose-500/5' : ''
      }`}
    >
      <div 
        {...listeners} 
        {...attributes} 
        className="cursor-grab active:cursor-grabbing flex justify-between items-center pb-2 border-b border-white/5 select-none"
      >
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{lead.mode} FTL</span>
        {/* drag grip handle icon */}
        <div className="flex flex-col gap-[2px] opacity-40 hover:opacity-100 transition-opacity">
          <div className="w-3 h-[2px] bg-slate-400 rounded-full" />
          <div className="w-3 h-[2px] bg-slate-400 rounded-full" />
          <div className="w-3 h-[2px] bg-slate-400 rounded-full" />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-start">
          <h4 className="text-xs font-bold text-white leading-tight">{lead.company}</h4>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            lead.isHot ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
          }`}>
            {lead.isHot ? 'Hot' : 'Cold'}
          </span>
        </div>
        
        <div className="text-[10px] text-slate-500 font-mono">Lane: {lead.originState} &rarr; {lead.destState}</div>

        {hasSlaBreach && (
          <div className="flex items-center gap-1.5 text-[9px] text-rose-400 font-bold uppercase tracking-widest">
            <AlertCircle className="w-3.5 h-3.5" />
            SLA Breached
          </div>
        )}

        {children}

        <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
          <span className="font-mono text-slate-300">INR {lead.calculatedCost.toLocaleString('en-IN')}</span>
          <span className="text-slate-500 font-bold uppercase tracking-widest">{lead.status}</span>
        </div>
      </div>
    </div>
  );
}
