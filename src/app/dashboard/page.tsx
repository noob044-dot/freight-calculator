/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, ArrowRight, AlertCircle, ThumbsUp, 
  Download, CreditCard, Plus, Edit2, Trash2, ChevronLeft,
  ChevronRight, LayoutGrid, Settings, FileSpreadsheet, Loader2
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lead, Forwarder, Invoice, ForwarderRate } from '../../lib/db';

export default function DashboardPage() {
  const [role, setRole] = useState<'admin' | 'forwarder'>('admin');
  const [selectedForwarderId, setSelectedForwarderId] = useState<string>('fwd-safexpress');
  
  // Database States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Tab states
  const [adminTab, setAdminTab] = useState<'leads' | 'forwarders' | 'billing'>('leads');
  const [forwarderTab, setForwarderTab] = useState<'pipeline' | 'ratecard' | 'billing'>('pipeline');
  
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

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Submit Bid
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
        await fetchData(); // refresh data
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

  // 2. Change Status Pipeline
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

  // 3. Save/Update Rate Card
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

  // 4. Pay Invoice via Razorpay Sandbox
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

  // 5. Generate PDF Invoice (GST Compliant)
  const downloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header banner
    doc.setFillColor(2, 6, 23); // slate-950
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FREIGHT PLATFORM INDIA', 14, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('GSTIN: 27AAACF9021K1Z3', 14, 29);
    
    // Invoice Title
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 50);
    
    // Key Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Invoice ID: ${invoice.id.toUpperCase()}`, 14, 60);
    doc.text(`Billing Month: ${invoice.month}`, 14, 65);
    doc.text(`Date of Issue: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 70);
    doc.text(`Payment Status: ${invoice.status.toUpperCase()}`, 14, 75);

    // Billed To
    const forwarder = forwarders.find(f => f.id === invoice.forwarderId);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 120, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.forwarderName, 120, 55);
    doc.text(`GSTIN: ${forwarder?.gstin || 'N/A'}`, 120, 60);
    doc.text('India Cargo Network Partner', 120, 65);

    // Invoice Table Items
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f8fafc] flex font-sans antialiased overflow-hidden">
      
      {/* Sidebar (collapsible spring) */}
      <aside 
        className="bg-black border-r border-white/5 flex flex-col justify-between transition-all duration-300 z-30"
        style={{ width: isSidebarExpanded ? '260px' : '72px' }}
      >
        <div className="space-y-8 py-6">
          {/* Logo draw header */}
          <div className="px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              {isSidebarExpanded && (
                <span className="font-bold text-xs uppercase tracking-wider text-white">Freight Intelligence</span>
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

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            
            {/* Common Dashboard Main Tab */}
            <button
              onClick={() => {
                if (role === 'admin') setAdminTab('leads');
                else setForwarderTab('pipeline');
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/5"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              {isSidebarExpanded && <span>Leads Hub</span>}
            </button>

            {/* Analytics Switcher */}
            <Link
              href="/dashboard/analytics"
              className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/5"
            >
              <FileSpreadsheet className="w-4 h-4 text-violet-400" />
              {isSidebarExpanded && <span>Analytics & BI</span>}
            </Link>

            {/* Rate Cards Manager */}
            {role === 'forwarder' && (
              <button
                onClick={() => setForwarderTab('ratecard')}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/5"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                {isSidebarExpanded && <span>Rate Cards</span>}
              </button>
            )}

            {/* Billing invoices manager */}
            <button
              onClick={() => {
                if (role === 'admin') setAdminTab('billing');
                else setForwarderTab('billing');
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/5"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              {isSidebarExpanded && <span>Billing Invoices</span>}
            </button>

            {/* System config / settings */}
            <button
              className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-500 hover:text-white hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
              {isSidebarExpanded && <span>Settings</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 flex flex-col items-center">
          {!isSidebarExpanded && (
            <button 
              onClick={() => setIsSidebarExpanded(true)}
              className="text-slate-500 hover:text-white cursor-pointer p-2 rounded-lg bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {isSidebarExpanded && (
            <div className="w-full flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              <span>Audited Session</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content Container */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Control Bar */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#030712]/30 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-display">Command Center</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Freight Logistics & Bidding Ledger</p>
          </div>

          <div className="flex items-center gap-6">
            
            {/* Forwarder dropdown simulation for role testing */}
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
            <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex">
              <button
                onClick={() => setRole('admin')}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  role === 'admin' ? 'bg-gradient-accent text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Platform Admin
              </button>
              <button
                onClick={() => setRole('forwarder')}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  role === 'forwarder' ? 'bg-gradient-accent text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Forwarder
              </button>
            </div>

          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Platform Admin Panel */}
          {role === 'admin' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Tabs */}
              <div className="flex border-b border-white/5 gap-2">
                <button
                  onClick={() => setAdminTab('leads')}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    adminTab === 'leads' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Leads Pipeline
                </button>
                <button
                  onClick={() => setAdminTab('forwarders')}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    adminTab === 'forwarders' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Forwarder Management
                </button>
                <button
                  onClick={() => setAdminTab('billing')}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    adminTab === 'billing' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Billing & Invoices
                </button>
              </div>

              {/* Admin Tab 1: Leads Pipeline (Kanban) */}
              {adminTab === 'leads' && (
                <div className="space-y-6">
                  
                  {/* Pipeline Kanban columns */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                    
                    {/* Column 1: New */}
                    <div className="bg-glass rounded-organic-1 p-5 flex flex-col space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-white/5">
                        <span>New requests</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-white">
                          {leads.filter(l => l.status === 'New').length}
                        </span>
                      </div>
                      
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                        {leads.filter(l => l.status === 'New').map(lead => {
                          const hasSlaBreach = isSlaBreached(lead);
                          return (
                            <div 
                              key={lead.id} 
                              className={`p-4 bg-black border rounded-xl space-y-3 transition-all hover:scale-[1.02] hover:-translate-y-1 ${
                                hasSlaBreach ? 'border-rose-600/40 shadow-lg shadow-rose-500/5' : 'border-white/5 hover:border-cyan-400/30'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{lead.mode} FTL</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  lead.isHot ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
                                }`}>
                                  {lead.isHot ? 'Hot Lead' : 'Cold Lead'}
                                </span>
                              </div>
                              
                              <h4 className="text-xs font-bold text-white leading-tight">{lead.company}</h4>
                              <div className="text-[10px] text-slate-500 font-mono">Lane: {lead.originState} &rarr; {lead.destState}</div>

                              {hasSlaBreach && (
                                <div className="flex items-center gap-1.5 text-[9px] text-rose-400 font-bold uppercase tracking-widest">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  SLA Breached
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-xs font-mono font-bold text-white">INR {lead.calculatedCost.toLocaleString('en-IN')}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStatusChange(lead.id, 'Contacted')}
                                    className="p-1 hover:text-cyan-400 transition-colors cursor-pointer text-slate-400"
                                    title="Mark Contacted"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Contacted */}
                    <div className="bg-glass rounded-organic-2 p-5 flex flex-col space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-white/5">
                        <span>Contacted</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-white">
                          {leads.filter(l => l.status === 'Contacted').length}
                        </span>
                      </div>
                      
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                        {leads.filter(l => l.status === 'Contacted').map(lead => (
                          <div key={lead.id} className="p-4 bg-black border border-white/5 rounded-xl space-y-3 hover:border-cyan-400/30 transition-all">
                            <h4 className="text-xs font-bold text-white leading-tight">{lead.company}</h4>
                            <div className="text-[10px] text-slate-500 font-mono">Weight: {lead.weightKg} kg | Mode: {lead.mode.toUpperCase()}</div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-xs font-mono font-bold text-white">INR {lead.calculatedCost.toLocaleString('en-IN')}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusChange(lead.id, 'Quoted')}
                                  className="p-1 hover:text-cyan-400 transition-colors cursor-pointer text-slate-400"
                                  title="Mark Quoted"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Quoted */}
                    <div className="bg-glass rounded-organic-3 p-5 flex flex-col space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-white/5">
                        <span>Quoted</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-white">
                          {leads.filter(l => l.status === 'Quoted').length}
                        </span>
                      </div>
                      
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                        {leads.filter(l => l.status === 'Quoted').map(lead => (
                          <div key={lead.id} className="p-4 bg-black border border-white/5 rounded-xl space-y-3 hover:border-cyan-400/30 transition-all">
                            <h4 className="text-xs font-bold text-white leading-tight">{lead.company}</h4>
                            <div className="text-[10px] text-slate-400">Total Bids Placed: <strong className="text-white">{lead.bids.length}</strong></div>
                            
                            {lead.bids.length > 0 && (
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
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-xs font-mono font-bold text-white">INR {lead.calculatedCost.toLocaleString('en-IN')}</span>
                              <button
                                onClick={() => handleStatusChange(lead.id, 'Lost')}
                                className="text-[9px] uppercase font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                Drop
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Won / Closed */}
                    <div className="bg-glass rounded-organic-1 p-5 flex flex-col space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-white/5">
                        <span>Won / Closed</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded-full text-white">
                          {leads.filter(l => l.status === 'Won').length}
                        </span>
                      </div>
                      
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
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
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Admin Tab 2: Forwarder Management */}
              {adminTab === 'forwarders' && (
                <div className="bg-glass rounded-organic-2 p-6 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Logistics Providers Directory</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Partner Name</th>
                          <th className="py-3 px-4">GSTIN</th>
                          <th className="py-3 px-4 text-center">Coverage rating</th>
                          <th className="py-3 px-4 text-center">Response SLA</th>
                          <th className="py-3 px-4 text-center">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forwarders.map(fwd => (
                          <tr key={fwd.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                            <td className="py-4 px-4 font-bold text-white">{fwd.name}</td>
                            <td className="py-4 px-4 font-mono">{fwd.gstin}</td>
                            <td className="py-4 px-4 text-center font-bold text-amber-500">★ {fwd.rating}</td>
                            <td className="py-4 px-4 text-center font-mono">{fwd.responseSlaMins} mins</td>
                            <td className="py-4 px-4 text-center font-mono">{fwd.winRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Admin Tab 3: Billing & Invoices */}
              {adminTab === 'billing' && (
                <div className="bg-glass rounded-organic-3 p-6 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Billing History</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Invoice ID</th>
                          <th className="py-3 px-4">Billed Partner</th>
                          <th className="py-3 px-4">Month</th>
                          <th className="py-3 px-4 text-right">Subtotal</th>
                          <th className="py-3 px-4 text-right">Total (Inc GST)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                            <td className="py-4 px-4 font-mono font-bold">{inv.id.toUpperCase()}</td>
                            <td className="py-4 px-4 font-bold text-white">{inv.forwarderName}</td>
                            <td className="py-4 px-4">{inv.month}</td>
                            <td className="py-4 px-4 text-right font-mono">INR {inv.subtotal.toLocaleString('en-IN')}</td>
                            <td className="py-4 px-4 text-right font-mono text-cyan-400 font-bold">INR {inv.total.toLocaleString('en-IN')}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => downloadInvoice(inv)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                PDF
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

          {/* Forwarder Panel */}
          {role === 'forwarder' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Tabs */}
              <div className="flex border-b border-white/5 gap-2">
                <button
                  onClick={() => setForwarderTab('pipeline')}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    forwarderTab === 'pipeline' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  My Bids & Pipeline
                </button>
                <button
                  onClick={() => setForwarderTab('ratecard')}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    forwarderTab === 'ratecard' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  My Rate Cards
                </button>
                <button
                  onClick={() => setForwarderTab('billing')}
                  className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    forwarderTab === 'billing' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  My Earnings & Billing
                </button>
              </div>

              {/* Forwarder Tab 1: Pipeline & Bids */}
              {forwarderTab === 'pipeline' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                  
                  {/* Left Col (2 cols span): Active Available Leads */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Available Marketplace Loads</h3>
                    
                    <div className="space-y-4">
                      {leads.filter(l => l.status === 'New' || l.status === 'Contacted').map(lead => {
                        const hasAlreadyBid = lead.bids.some(b => b.forwarderId === selectedForwarderId);
                        
                        return (
                          <div key={lead.id} className="bg-glass rounded-organic-2 p-6 border border-white/5 hover:border-cyan-400/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] bg-cyan-400/10 text-cyan-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  {lead.mode}
                                </span>
                                <span className="text-xs font-bold text-white">{lead.company}</span>
                              </div>
                              <div className="text-xs font-mono text-slate-400">
                                Lane: {lead.originState} ({lead.originPincode}) &rarr; {lead.destState} ({lead.destPincode})
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Weight: {lead.weightKg} kg | Commodity: {lead.commodity.toUpperCase()}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {hasAlreadyBid ? (
                                <span className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                  Bid Submitted
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => autoCalculateBid(lead)}
                                    className="px-4 py-2.5 bg-gradient-accent text-white font-bold text-[9px] uppercase tracking-wider rounded-organic-1 hover:scale-105 transition-all cursor-pointer"
                                  >
                                    Auto Bid
                                  </button>
                                  <button
                                    onClick={() => setBidForm({ leadId: lead.id, amount: '', transitDays: '', remarks: '' })}
                                    className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider rounded-organic-2 transition-all cursor-pointer"
                                  >
                                    Custom Bid
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Col (1 col span): Active Bid Panel */}
                  <div className="lg:col-span-1 bg-glass rounded-organic-3 p-6 h-fit space-y-6 border border-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bid Submission Panel</h3>
                    
                    {bidForm ? (
                      <form onSubmit={handleBidSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bid amount (INR)</label>
                          <input
                            type="number"
                            required
                            value={bidForm.amount}
                            onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                            className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                            placeholder="e.g. 24000"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transit Days</label>
                          <input
                            type="number"
                            required
                            value={bidForm.transitDays}
                            onChange={(e) => setBidForm({ ...bidForm, transitDays: e.target.value })}
                            className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                            placeholder="e.g. 3"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks / SLA Commitments</label>
                          <textarea
                            value={bidForm.remarks}
                            onChange={(e) => setBidForm({ ...bidForm, remarks: e.target.value })}
                            rows={3}
                            className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                            placeholder="e.g. Blue Dart express service guarantee"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-gradient-accent text-white font-bold text-[9px] uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Submit Bid
                          </button>
                          <button
                            type="button"
                            onClick={() => setBidForm(null)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-[9px] uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        Select a lead to configure and submit bids.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Forwarder Tab 2: My Rate Cards (Inline Edit Table) */}
              {forwarderTab === 'ratecard' && activeForwarder && (
                <div className="bg-glass rounded-organic-2 p-6 space-y-6">
                  
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">My Base Freight Rate Cards</h3>
                    <button
                      onClick={() => setShowAddRate(!showAddRate)}
                      className="inline-flex items-center gap-1.5 bg-gradient-accent text-white font-bold text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-xl hover:scale-105 transition-all cursor-pointer shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Lane
                    </button>
                  </div>

                  {/* Add Rate Form */}
                  {showAddRate && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-4 items-end animate-fade-in">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Origin State</label>
                        <input
                          type="text"
                          value={newRate.originState}
                          onChange={(e) => setNewRate({ ...newRate, originState: e.target.value.toUpperCase() })}
                          className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dest State</label>
                        <input
                          type="text"
                          value={newRate.destState}
                          onChange={(e) => setNewRate({ ...newRate, destState: e.target.value.toUpperCase() })}
                          className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Price</label>
                        <input
                          type="number"
                          value={newRate.basePrice}
                          onChange={(e) => setNewRate({ ...newRate, basePrice: Number(e.target.value) })}
                          className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price Per Kg</label>
                        <input
                          type="number"
                          value={newRate.pricePerKg}
                          onChange={(e) => setNewRate({ ...newRate, pricePerKg: Number(e.target.value) })}
                          className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddRate}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          Save Lane
                        </button>
                        <button
                          onClick={() => setShowAddRate(false)}
                          className="py-2 px-3 bg-white/5 border border-white/10 text-slate-300 font-bold text-[9px] uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline edit Rate table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Lane route</th>
                          <th className="py-3 px-4 text-center">Transport mode</th>
                          <th className="py-3 px-4 text-right">Base flat Price</th>
                          <th className="py-3 px-4 text-right">Price per kg</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeForwarder.rateCard.map((rate, idx) => {
                          const isEditing = editRateIdx === idx;
                          
                          return (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01]">
                              <td className="py-4 px-4 font-bold text-white">
                                {rate.originState} &rarr; {rate.destState}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="bg-cyan-400/10 text-cyan-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  {rate.mode}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-mono">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={tempBasePrice}
                                    onChange={(e) => setTempBasePrice(e.target.value)}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-right text-xs text-white focus:border-cyan-400 outline-none w-24"
                                  />
                                ) : (
                                  `INR ${rate.basePrice.toLocaleString('en-IN')}`
                                )}
                              </td>
                              <td className="py-4 px-4 text-right font-mono">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={tempPricePerKg}
                                    onChange={(e) => setTempPricePerKg(e.target.value)}
                                    className="bg-black border border-white/10 rounded px-2 py-1 text-right text-xs text-white focus:border-cyan-400 outline-none w-20"
                                  />
                                ) : (
                                  `INR ${rate.pricePerKg.toFixed(2)}`
                                )}
                              </td>
                              <td className="py-4 px-4 text-right space-x-3">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveInlineRate(idx)}
                                      className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditRateIdx(null)}
                                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEditRate(idx, rate)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRate(idx)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Forwarder Tab 3: Earnings & Billing */}
              {forwarderTab === 'billing' && (
                <div className="bg-glass rounded-organic-3 p-6 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">My Operational Billing & Invoices</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Invoice ID</th>
                          <th className="py-3 px-4">Month</th>
                          <th className="py-3 px-4">Generated Leads</th>
                          <th className="py-3 px-4 text-right">GST Fee</th>
                          <th className="py-3 px-4 text-right">Grand Total</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.filter(i => i.forwarderId === selectedForwarderId).map(inv => (
                          <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                            <td className="py-4 px-4 font-mono font-bold">{inv.id.toUpperCase()}</td>
                            <td className="py-4 px-4">{inv.month}</td>
                            <td className="py-4 px-4">{inv.leadsCount} leads</td>
                            <td className="py-4 px-4 text-right font-mono">INR {(inv.cgst + inv.sgst).toLocaleString('en-IN')}</td>
                            <td className="py-4 px-4 text-right font-mono text-cyan-400 font-bold">INR {inv.total.toLocaleString('en-IN')}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right space-x-4">
                              {inv.status === 'Unpaid' && (
                                <button
                                  onClick={() => handleInvoicePay(inv.id)}
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Pay Bill
                                </button>
                              )}
                              <button
                                onClick={() => downloadInvoice(inv)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Invoice PDF
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

        </div>

      </main>

    </div>
  );
}
