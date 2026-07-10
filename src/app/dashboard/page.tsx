/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Check, X, FileText, Users, 
  DollarSign, Clock, ArrowRight, AlertCircle, ThumbsUp, 
  Download, CreditCard, Plus, Edit2, Trash2
} from 'lucide-react';
import { Lead, Forwarder, Invoice, ForwarderRate } from '../../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [bidForm, setBidForm] = useState<{ leadId: string; amount: string; transitDays: string; remarks: string } | null>(null);
  const [editRate, setEditRate] = useState<{ idx: number; rate: ForwarderRate } | null>(null);
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

  // Auto-calculate bid from rate card
  const autoCalculateBid = (lead: Lead) => {
    if (!activeForwarder) return;
    
    // Find matching rate in rate card
    const rate = activeForwarder.rateCard.find(r => 
      r.originState.toUpperCase() === lead.originState.toUpperCase() &&
      r.destState.toUpperCase() === lead.destState.toUpperCase() &&
      r.mode === lead.mode
    );

    if (rate) {
      const calculatedAmount = rate.basePrice + (rate.pricePerKg * lead.weightKg);
      setBidForm(prev => prev ? {
        ...prev,
        amount: Math.round(calculatedAmount).toString(),
        transitDays: lead.mode === 'road' ? '3' : lead.mode === 'air' ? '1' : lead.mode === 'sea' ? '14' : '5'
      } : null);
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

  // 3. Edit Rate Card
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
        setEditRate(null);
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
    
    // Header
    doc.setFillColor(10, 15, 26); // dark theme main bg
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
      ['Qualified Marketplace Lead Generation Fees', `${invoice.leadsCount} leads`, `₹${invoice.subtotal}`],
      ['CGST @ 9%', '', `₹${invoice.cgst}`],
      ['SGST @ 9%', '', `₹${invoice.sgst}`],
      ['Grand Total', '', `₹${invoice.total}`]
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

    // Save
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  // Helper: check if SLA is breached (> 2 hours and still in "New" status)
  const isSlaBreached = (lead: Lead) => {
    if (lead.status !== 'New') return false;
    const hoursElapsed = (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 2;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-fg-muted font-mono">Loading Marketplace Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg font-sans pb-12">
      
      {/* 1. Header & Switcher */}
      <nav className="border-b border-border bg-bg-elevated/40 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-accent" />
              <span className="font-bold tracking-wider text-sm uppercase">Marketplace Portal</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Role Switcher */}
              <div className="flex bg-bg border border-border p-1 rounded-lg">
                <button
                  onClick={() => setRole('admin')}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
                    role === 'admin' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Platform Admin
                </button>
                <button
                  onClick={() => setRole('forwarder')}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
                    role === 'forwarder' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Forwarder
                </button>
              </div>

              {/* Forwarder Selector (when role is forwarder) */}
              {role === 'forwarder' && (
                <select
                  value={selectedForwarderId}
                  onChange={(e) => setSelectedForwarderId(e.target.value)}
                  className="bg-bg-elevated border border-border rounded-lg text-xs font-bold text-fg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {forwarders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* ================= ADMIN CONSOLE VIEW ================= */}
        {role === 'admin' && (
          <div className="space-y-8">
            
            {/* Admin Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-card-custom border border-border p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">Captured Leads</span>
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-2xl font-bold font-mono">{leads.length}</h3>
                <p className="text-[10px] text-fg-muted mt-1">Total inquiries compiled</p>
              </div>
              <div className="bg-card-custom border border-border p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">Platform Revenue</span>
                  <DollarSign className="w-4 h-4 text-success" />
                </div>
                <h3 className="text-2xl font-bold font-mono">
                  ₹{leads.reduce((sum, l) => sum + l.leadCost, 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-success font-bold mt-1">₹500 / ₹1000 per lead model</p>
              </div>
              <div className="bg-card-custom border border-border p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">Invoiced Total</span>
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-2xl font-bold font-mono">
                  ₹{invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-fg-muted mt-1">Monthly billing ledgers</p>
              </div>
              <div className="bg-card-custom border border-border p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">Collected Fees</span>
                  <Check className="w-4 h-4 text-success" />
                </div>
                <h3 className="text-2xl font-bold font-mono">
                  ₹{invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
                </h3>
                <p className="text-[10px] text-fg-muted mt-1">Outstanding: ₹{invoices.filter(i => i.status === 'Unpaid').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="border-b border-border flex gap-6">
              <button
                onClick={() => setAdminTab('leads')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  adminTab === 'leads' ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                Lead Registry ({leads.length})
              </button>
              <button
                onClick={() => setAdminTab('forwarders')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  adminTab === 'forwarders' ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                Forwarder Directory ({forwarders.length})
              </button>
              <button
                onClick={() => setAdminTab('billing')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  adminTab === 'billing' ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                Billing & Invoices ({invoices.length})
              </button>
            </div>

            {/* Tab Panels */}
            {adminTab === 'leads' && (
              <div className="bg-card-custom border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase">All Inquiries</h3>
                  <span className="text-xs text-fg-muted">Score measures value & volume</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-bg-elevated/40 text-[10px] uppercase font-bold text-fg-muted tracking-wider">
                        <th className="px-6 py-3">Lead ID / Date</th>
                        <th className="px-6 py-3">Company & Contact</th>
                        <th className="px-6 py-3">Route / Weight</th>
                        <th className="px-6 py-3">Class</th>
                        <th className="px-6 py-3">Matches / Bids</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs font-mono">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-fg-muted">No leads captured yet.</td>
                        </tr>
                      ) : (
                        leads.map((l) => (
                          <tr key={l.id} className="hover:bg-bg-elevated/10">
                            <td className="px-6 py-4">
                              <span className="font-bold text-fg block">{l.id}</span>
                              <span className="text-[10px] text-fg-muted">{new Date(l.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4 font-sans">
                              <span className="font-bold block text-fg">{l.company}</span>
                              <span className="text-xs text-fg-muted block">{l.name} • {l.phone}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-fg font-bold block">{l.originState} → {l.destState}</span>
                              <span className="text-fg-muted text-[10px] block">{(l.weightKg / 1000).toFixed(1)}T • {l.mode.toUpperCase()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.isHot ? 'bg-error/10 text-error border border-error/20' : 'bg-accent-soft text-accent border border-accent/20'
                              }`}>
                                {l.isHot ? '🔥 HOT (₹1000)' : '❄️ COLD (₹500)'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-fg font-bold block">{l.bids.length} Bids submitted</span>
                              <span className="text-[10px] text-fg-muted block">
                                {l.bids.map(b => b.forwarderName.split(' ')[0]).join(', ') || 'Waiting'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                l.status === 'Won' ? 'bg-success/15 text-success' :
                                l.status === 'Lost' ? 'bg-error/15 text-error' :
                                l.status === 'Quoted' ? 'bg-accent/15 text-accent' :
                                'bg-warning/15 text-warning'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminTab === 'forwarders' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {forwarders.map((fwd) => (
                  <div key={fwd.id} className="bg-card-custom border border-border rounded-xl p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-fg">{fwd.name}</h4>
                        <p className="text-[10px] text-fg-muted font-mono mt-0.5">GSTIN: {fwd.gstin}</p>
                      </div>
                      <span className="bg-accent-soft text-accent text-xs font-bold px-2 py-0.5 rounded">
                        ★ {fwd.rating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-b border-border py-4 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-fg-muted block uppercase">Response SLA</span>
                        <span className="font-bold text-fg">{fwd.responseSlaMins} mins</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-fg-muted block uppercase">Win Rate</span>
                        <span className="font-bold text-fg">{fwd.winRate}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">Service Lanes</span>
                      <div className="flex flex-wrap gap-1.5">
                        {fwd.coveredLanes.map((lane, i) => (
                          <span key={i} className="bg-bg border border-border px-2 py-0.5 rounded text-[10px] text-fg-muted">
                            {lane}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">Supported Modes</span>
                      <div className="flex gap-2">
                        {fwd.supportedModes.map((m, i) => (
                          <span key={i} className="text-xs uppercase font-bold text-accent">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'billing' && (
              <div className="bg-card-custom border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-bold uppercase">Tax Invoices (GST Compliant)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-bg-elevated/40 text-[10px] uppercase font-bold text-fg-muted tracking-wider">
                        <th className="px-6 py-3">Invoice ID / Month</th>
                        <th className="px-6 py-3">Billed Partner</th>
                        <th className="px-6 py-3 text-right">Leads Count</th>
                        <th className="px-6 py-3 text-right">Subtotal</th>
                        <th className="px-6 py-3 text-right">CGST + SGST (18%)</th>
                        <th className="px-6 py-3 text-right">Grand Total</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs font-mono">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-10 text-center text-fg-muted">No monthly invoices created yet.</td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-bg-elevated/10">
                            <td className="px-6 py-4 font-bold text-fg uppercase">{inv.id} <span className="block text-[10px] text-fg-muted font-normal">{inv.month}</span></td>
                            <td className="px-6 py-4 font-sans font-bold text-fg">{inv.forwarderName}</td>
                            <td className="px-6 py-4 text-right font-bold">{inv.leadsCount} leads</td>
                            <td className="px-6 py-4 text-right">₹{inv.subtotal}</td>
                            <td className="px-6 py-4 text-right">₹{inv.cgst + inv.sgst}</td>
                            <td className="px-6 py-4 text-right font-bold text-accent">₹{inv.total}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'Paid' ? 'bg-success/15 text-success' : 'bg-error/15 text-error animate-pulse'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => downloadInvoice(inv)}
                                  title="Download PDF"
                                  className="p-1 text-fg-muted hover:text-accent border border-border bg-bg rounded hover:bg-bg-elevated transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                {inv.status === 'Unpaid' && (
                                  <button
                                    onClick={() => handleInvoicePay(inv.id)}
                                    title="Pay Invoice"
                                    className="px-2 py-1 bg-success/10 hover:bg-success text-success hover:text-white border border-success/30 rounded flex items-center gap-1 text-[10px] font-bold transition-all"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    PAY
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= FORWARDER ACCOUNT VIEW ================= */}
        {role === 'forwarder' && activeForwarder && (
          <div className="space-y-8">
            
            {/* Header info */}
            <div className="bg-card-custom border border-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-fg">{activeForwarder.name} Workspace</h2>
                <p className="text-xs text-fg-muted mt-1 font-mono">Company ID: {activeForwarder.id} • GST: {activeForwarder.gstin}</p>
              </div>
              <div className="flex bg-bg border border-border p-1 rounded-lg">
                <button
                  onClick={() => setForwarderTab('pipeline')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
                    forwarderTab === 'pipeline' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Leads Pipeline
                </button>
                <button
                  onClick={() => setForwarderTab('ratecard')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
                    forwarderTab === 'ratecard' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  My Rate Cards
                </button>
                <button
                  onClick={() => setForwarderTab('billing')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md tracking-wider transition-colors ${
                    forwarderTab === 'billing' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  Monthly Invoices
                </button>
              </div>
            </div>

            {/* SLA breaches & performance summary */}
            {forwarderTab === 'pipeline' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card-custom border border-border p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-fg-muted uppercase tracking-wider block">SLA Compliance</span>
                    <span className="text-xl font-bold font-mono text-success">100%</span>
                  </div>
                  <Clock className="w-8 h-8 text-success/20" />
                </div>
                <div className="bg-card-custom border border-border p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-fg-muted uppercase tracking-wider block">Win Rate</span>
                    <span className="text-xl font-bold font-mono text-accent">{activeForwarder.winRate}%</span>
                  </div>
                  <ThumbsUp className="w-8 h-8 text-accent/20" />
                </div>
                <div className="bg-card-custom border border-border p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-fg-muted uppercase tracking-wider block">SLA Breached Leads</span>
                    <span className={`text-xl font-bold font-mono ${
                      leads.filter(l => isSlaBreached(l)).length > 0 ? 'text-error animate-pulse' : 'text-fg-muted'
                    }`}>
                      {leads.filter(l => isSlaBreached(l)).length}
                    </span>
                  </div>
                  <AlertCircle className={`w-8 h-8 ${leads.filter(l => isSlaBreached(l)).length > 0 ? 'text-error/30' : 'text-fg-muted/20'}`} />
                </div>
              </div>
            )}

            {/* TAB: Pipeline */}
            {forwarderTab === 'pipeline' && (
              <div className="space-y-6">
                
                {/* List of matched leads */}
                <div className="bg-card-custom border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-sm font-bold uppercase">Leads Matching Your Covered Lanes & Modes</h3>
                  </div>

                  <div className="divide-y divide-border">
                    {leads.filter(l => {
                      // Filter leads that are compatible with this forwarder
                      const supportsMode = activeForwarder.supportedModes.includes(l.mode);
                      const coversOrigin = activeForwarder.coveredLanes.some(s => s.toUpperCase() === l.originState.toUpperCase());
                      const coversDest = activeForwarder.coveredLanes.some(s => s.toUpperCase() === l.destState.toUpperCase());
                      return supportsMode && (coversOrigin || coversDest);
                    }).length === 0 ? (
                      <div className="p-12 text-center text-fg-muted text-sm">
                        No compatible matching leads found. Adjust covered lanes in your rate card.
                      </div>
                    ) : (
                      leads.filter(l => {
                        const supportsMode = activeForwarder.supportedModes.includes(l.mode);
                        const coversOrigin = activeForwarder.coveredLanes.some(s => s.toUpperCase() === l.originState.toUpperCase());
                        const coversDest = activeForwarder.coveredLanes.some(s => s.toUpperCase() === l.destState.toUpperCase());
                        return supportsMode && (coversOrigin || coversDest);
                      }).map((l) => {
                        const hasBid = l.bids.some(b => b.forwarderId === selectedForwarderId);
                        const myBid = l.bids.find(b => b.forwarderId === selectedForwarderId);
                        const breached = isSlaBreached(l);

                        return (
                          <div key={l.id} className="p-6 hover:bg-bg-elevated/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-3 flex-1">
                              {/* Headers & Tags */}
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold font-mono text-fg">{l.id}</span>
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                  l.isHot ? 'bg-error/15 text-error' : 'bg-accent-soft text-accent'
                                }`}>
                                  {l.isHot ? '🔥 HOT (>50T/mo)' : '❄️ COLD'}
                                </span>
                                {breached && (
                                  <span className="bg-error/20 text-error border border-error/30 text-[9px] font-bold px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    SLA BREACHED (&gt;2h)
                                  </span>
                                )}
                                <span className="text-[10px] text-fg-muted font-mono">
                                  Captured: {new Date(l.createdAt).toLocaleTimeString()}
                                </span>
                              </div>

                              {/* Route details */}
                              <div className="flex items-center gap-4 text-sm font-bold">
                                <span>{l.originState}</span>
                                <ArrowRight className="w-4 h-4 text-accent" />
                                <span>{l.destState}</span>
                              </div>

                              {/* Parameters */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-fg-muted">
                                <div>
                                  <span className="text-[9px] block uppercase">Weight</span>
                                  <span className="font-bold text-fg">{l.weightKg.toLocaleString()} kg</span>
                                </div>
                                <div>
                                  <span className="text-[9px] block uppercase">Commodity</span>
                                  <span className="font-bold text-fg capitalize">{l.commodity}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] block uppercase">Mode</span>
                                  <span className="font-bold text-fg uppercase">{l.mode}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] block uppercase">Platform Quote</span>
                                  <span className="font-bold text-accent">₹{l.calculatedCost.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Bidding Console & Statuses */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-bg-elevated/40 border border-border p-4 rounded-lg w-full md:w-auto">
                              <div className="space-y-2 w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">Submit Bid</span>
                                {hasBid ? (
                                  <div className="font-mono text-xs">
                                    <span className="text-fg font-bold block">My Bid: ₹{myBid?.amount.toLocaleString()}</span>
                                    <span className="text-[10px] text-fg-muted block">Transit: {myBid?.transitDays} days • {myBid?.status}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setBidForm({ leadId: l.id, amount: '', transitDays: '', remarks: '' })}
                                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer w-full sm:w-auto text-center"
                                  >
                                    Place Quote Bid
                                  </button>
                                )}
                              </div>

                              <div className="border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4 space-y-2 w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">Lead Status</span>
                                <select
                                  value={l.status}
                                  onChange={(e) => handleStatusChange(l.id, e.target.value)}
                                  className="bg-bg border border-border rounded px-2 py-1 text-xs font-bold text-fg focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-auto"
                                >
                                  <option value="New">New</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Quoted">Quoted</option>
                                  <option value="Won">Won</option>
                                  <option value="Lost">Lost</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bidding Form Modal Popup */}
                {bidForm && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card-custom border border-border p-6 rounded-xl w-full max-w-md space-y-6">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <h4 className="font-bold text-fg uppercase">Place Custom Quote Bid</h4>
                        <button onClick={() => setBidForm(null)} className="p-1 hover:bg-bg-elevated rounded">
                          <X className="w-4 h-4 text-fg-muted hover:text-fg" />
                        </button>
                      </div>

                      <form onSubmit={handleBidSubmit} className="space-y-4">
                        <div className="flex justify-between items-center bg-accent-soft p-3 rounded-lg border border-accent/20">
                          <span className="text-xs text-accent">Auto-fill pricing using current Rate Card?</span>
                          <button
                            type="button"
                            onClick={() => {
                              const targetLead = leads.find(l => l.id === bidForm.leadId);
                              if (targetLead) autoCalculateBid(targetLead);
                            }}
                            className="bg-accent hover:bg-accent-hover text-white text-[9px] font-bold px-2 py-1.5 rounded uppercase tracking-wider"
                          >
                            Auto Bid
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Bid Amount (INR)</label>
                            <input
                              type="number"
                              required
                              value={bidForm.amount}
                              onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs focus:ring-1 focus:ring-accent"
                              placeholder="e.g. 55000"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Transit Time (Days)</label>
                            <input
                              type="number"
                              required
                              value={bidForm.transitDays}
                              onChange={(e) => setBidForm({ ...bidForm, transitDays: e.target.value })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs focus:ring-1 focus:ring-accent"
                              placeholder="e.g. 3"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Remarks (Optional)</label>
                          <textarea
                            value={bidForm.remarks}
                            onChange={(e) => setBidForm({ ...bidForm, remarks: e.target.value })}
                            className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs focus:ring-1 focus:ring-accent h-16 resize-none"
                            placeholder="Add terms, exclusions..."
                          />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border pt-4">
                          <button
                            type="button"
                            onClick={() => setBidForm(null)}
                            className="px-4 py-2 border border-border text-fg-muted hover:text-fg text-xs font-bold uppercase rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase rounded-lg"
                          >
                            Submit Bid
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: Rate Card Editor */}
            {forwarderTab === 'ratecard' && (
              <div className="space-y-6">
                
                {/* Active Rate cards */}
                <div className="bg-card-custom border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase">Rate Card Pricing Lanes</h3>
                    <button
                      onClick={() => setShowAddRate(true)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Lane Rate
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-bg-elevated/40 text-[10px] uppercase font-bold text-fg-muted tracking-wider">
                          <th className="px-6 py-3">Origin State</th>
                          <th className="px-6 py-3">Destination State</th>
                          <th className="px-6 py-3">Mode</th>
                          <th className="px-6 py-3 text-right">Base Setup Price</th>
                          <th className="px-6 py-3 text-right">Rate per Kg</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs font-mono text-fg">
                        {activeForwarder.rateCard.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-fg-muted">No pricing lanes registered yet.</td>
                          </tr>
                        ) : (
                          activeForwarder.rateCard.map((lane, idx) => (
                            <tr key={idx} className="hover:bg-bg-elevated/5">
                              <td className="px-6 py-4 font-bold">{lane.originState}</td>
                              <td className="px-6 py-4 font-bold">{lane.destState}</td>
                              <td className="px-6 py-4 uppercase text-accent font-bold">{lane.mode}</td>
                              <td className="px-6 py-4 text-right">₹{lane.basePrice}</td>
                              <td className="px-6 py-4 text-right">₹{lane.pricePerKg} / kg</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setEditRate({ idx, rate: { ...lane } })}
                                    className="p-1 hover:text-accent"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRate(idx)}
                                    className="p-1 hover:text-error"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit Modal popup */}
                {editRate && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card-custom border border-border p-6 rounded-xl w-full max-w-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <h4 className="font-bold text-fg uppercase">Edit Rate Settings</h4>
                        <button onClick={() => setEditRate(null)} className="p-1 hover:bg-bg-elevated rounded">
                          <X className="w-4 h-4 text-fg-muted" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Base Price (INR)</label>
                            <input
                              type="number"
                              value={editRate.rate.basePrice}
                              onChange={(e) => setEditRate({
                                ...editRate,
                                rate: { ...editRate.rate, basePrice: Number(e.target.value) }
                              })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Rate per Kg (INR)</label>
                            <input
                              type="number"
                              value={editRate.rate.pricePerKg}
                              onChange={(e) => setEditRate({
                                ...editRate,
                                rate: { ...editRate.rate, pricePerKg: Number(e.target.value) }
                              })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-border pt-4">
                          <button
                            onClick={() => setEditRate(null)}
                            className="px-4 py-2 border border-border text-fg-muted hover:text-fg text-xs font-bold uppercase rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const updated = [...activeForwarder.rateCard];
                              updated[editRate.idx] = editRate.rate;
                              saveRateCard(updated);
                            }}
                            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Modal popup */}
                {showAddRate && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-card-custom border border-border p-6 rounded-xl w-full max-w-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <h4 className="font-bold text-fg uppercase">Add New Price Lane</h4>
                        <button onClick={() => setShowAddRate(false)} className="p-1 hover:bg-bg-elevated rounded">
                          <X className="w-4 h-4 text-fg-muted" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Origin State</label>
                            <input
                              type="text"
                              value={newRate.originState}
                              onChange={(e) => setNewRate({ ...newRate, originState: e.target.value.toUpperCase() })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs uppercase"
                              placeholder="e.g. MAHARASHTRA"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Dest State</label>
                            <input
                              type="text"
                              value={newRate.destState}
                              onChange={(e) => setNewRate({ ...newRate, destState: e.target.value.toUpperCase() })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs uppercase"
                              placeholder="e.g. DELHI"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Mode</label>
                            <select
                              value={newRate.mode}
                              onChange={(e) => setNewRate({ ...newRate, mode: e.target.value as 'road' | 'air' | 'sea' | 'rail' })}
                              className="w-full bg-bg border border-border rounded px-2 py-2 text-fg text-xs"
                            >
                              <option value="road">Road</option>
                              <option value="air">Air</option>
                              <option value="sea">Sea</option>
                              <option value="rail">Rail</option>
                            </select>
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Base setup</label>
                            <input
                              type="number"
                              value={newRate.basePrice}
                              onChange={(e) => setNewRate({ ...newRate, basePrice: Number(e.target.value) })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-fg-muted uppercase mb-1">Per kg fee</label>
                            <input
                              type="number"
                              value={newRate.pricePerKg}
                              onChange={(e) => setNewRate({ ...newRate, pricePerKg: Number(e.target.value) })}
                              className="w-full bg-bg border border-border rounded px-3 py-2 text-fg text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-border pt-4">
                          <button
                            onClick={() => setShowAddRate(false)}
                            className="px-4 py-2 border border-border text-fg-muted hover:text-fg text-xs font-bold uppercase rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddRate}
                            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase rounded-lg"
                          >
                            Add Lane
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: Forwarder Invoices */}
            {forwarderTab === 'billing' && (
              <div className="bg-card-custom border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-bold uppercase">My Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-bg-elevated/40 text-[10px] uppercase font-bold text-fg-muted tracking-wider">
                        <th className="px-6 py-3">Invoice ID / Month</th>
                        <th className="px-6 py-3 text-right">Leads Acquired</th>
                        <th className="px-6 py-3 text-right">Subtotal</th>
                        <th className="px-6 py-3 text-right">CGST + SGST (18%)</th>
                        <th className="px-6 py-3 text-right">Grand Total</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs font-mono text-fg">
                      {invoices.filter(i => i.forwarderId === selectedForwarderId).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-fg-muted">No monthly billing records yet.</td>
                        </tr>
                      ) : (
                        invoices.filter(i => i.forwarderId === selectedForwarderId).map((inv) => (
                          <tr key={inv.id} className="hover:bg-bg-elevated/5">
                            <td className="px-6 py-4 font-bold uppercase">{inv.id} <span className="block text-[10px] text-fg-muted font-normal">{inv.month}</span></td>
                            <td className="px-6 py-4 text-right font-bold">{inv.leadsCount} leads</td>
                            <td className="px-6 py-4 text-right">₹{inv.subtotal}</td>
                            <td className="px-6 py-4 text-right">₹{inv.cgst + inv.sgst}</td>
                            <td className="px-6 py-4 text-right font-bold text-accent">₹{inv.total}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'Paid' ? 'bg-success/15 text-success' : 'bg-error/15 text-error animate-pulse'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => downloadInvoice(inv)}
                                  title="Download PDF"
                                  className="p-1 text-fg-muted hover:text-accent border border-border bg-bg rounded hover:bg-bg-elevated transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                {inv.status === 'Unpaid' && (
                                  <button
                                    onClick={() => handleInvoicePay(inv.id)}
                                    title="Pay via Razorpay sandbox"
                                    className="px-2 py-1 bg-success/10 hover:bg-success text-success hover:text-white border border-success/30 rounded flex items-center gap-1 text-[10px] font-bold transition-all"
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    PAY NOW
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
