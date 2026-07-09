import { getInvoices, saveInvoices, Invoice, Lead, getForwarders } from './db';

/**
 * Adds a lead billing item to a forwarder's active monthly invoice.
 * Generates a GST-compliant format (9% CGST + 9% SGST).
 */
export function billForwarderForLead(forwarderId: string, lead: Lead): void {
  const invoices = getInvoices();
  const forwarders = getForwarders();
  const fwd = forwarders.find((f) => f.id === forwarderId);
  if (!fwd) return;

  const date = new Date();
  const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g., "July 2026"

  // Find existing unpaid invoice for the current month
  let invoiceIdx = invoices.findIndex(
    (inv) => inv.forwarderId === forwarderId && inv.month === monthStr && inv.status === 'Unpaid'
  );

  let invoice: Invoice;

  if (invoiceIdx === -1) {
    invoice = {
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      forwarderId,
      forwarderName: fwd.name,
      month: monthStr,
      leadsCount: 0,
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    };
    invoices.push(invoice);
    invoiceIdx = invoices.length - 1;
  } else {
    invoice = invoices[invoiceIdx];
  }

  // Increment metrics
  invoice.leadsCount += 1;
  invoice.subtotal += lead.leadCost; // ₹500 or ₹1000
  invoice.cgst = Math.round(invoice.subtotal * 0.09);
  invoice.sgst = Math.round(invoice.subtotal * 0.09);
  invoice.total = invoice.subtotal + invoice.cgst + invoice.sgst;

  invoices[invoiceIdx] = invoice;
  saveInvoices(invoices);
}
