import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteResult, Benchmark } from '../types';

export function exportToPDF(quote: QuoteResult, benchmark: Benchmark | null | undefined) {
  const doc = new jsPDF();
  
  // Header Accent Bar
  doc.setFillColor(14, 165, 233); // sky-500 (#0ea5e9)
  doc.rect(0, 0, 210, 8, 'F');

  // Title
  doc.setTextColor(17, 24, 39); // zinc-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FREIGHT QUOTE ESTIMATE', 14, 25);
  
  // Metadata Table / Key-Values
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // zinc-500
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 33);
  doc.text(`Reference ID: FQ-${new Date().getTime().toString().slice(-6)}`, 14, 38);
  doc.text(`Transport Mode: ${quote.mode.toUpperCase()}`, 14, 43);

  // Route section
  doc.setDrawColor(243, 244, 246);
  doc.line(14, 48, 196, 48);

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Shipment Route & Parameters', 14, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Origin Pincode Area: ${quote.originName}`, 14, 62);
  doc.text(`Destination Pincode Area: ${quote.destName}`, 14, 67);
  doc.text(`Total Distance: ${quote.distanceKm} km`, 14, 72);
  doc.text(`Transit Time Estimate: ${quote.transitDays} Days (${quote.durationHrs} hours)`, 14, 77);
  doc.text(`Service Provider class: ${quote.vehicle}`, 14, 82);

  // Cost breakdown
  const tableRows = [
    ['Base Freight', `INR ${quote.breakdown.baseFreight.toLocaleString('en-IN')}`],
    ['Fuel Surcharge', `INR ${quote.breakdown.fuelSurcharge.toLocaleString('en-IN')}`],
    ['Commodity Risk Adjustment', `INR ${quote.breakdown.commodityAdjustment.toLocaleString('en-IN')}`],
    ['NHAI Toll Fees', `INR ${quote.breakdown.tolls.toLocaleString('en-IN')}`],
    ['Pickup Feeder Leg', `INR ${quote.breakdown.pickupLastMile.toLocaleString('en-IN')}`],
    ['Delivery Feeder Leg', `INR ${quote.breakdown.deliveryLastMile.toLocaleString('en-IN')}`],
    ['State Entry Tax / Permits', `INR ${quote.breakdown.entryTax.toLocaleString('en-IN')}`],
    ['Cargo Insurance Surcharge', `INR ${quote.breakdown.insurance.toLocaleString('en-IN')}`],
    ['Documentation & Handling', `INR ${quote.breakdown.documentation.toLocaleString('en-IN')}`],
    ['TOTAL FREIGHT ESTIMATE (Excl. GST)', `INR ${quote.total.toLocaleString('en-IN')}`]
  ];

  autoTable(doc, {
    startY: 88,
    head: [['Quote Component', 'Charge']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    },
    didParseCell: function (data) {
      if (data.row.index === 9) { // Make the total row bold
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 10;
        data.cell.styles.fillColor = [240, 249, 255]; // light blue
      }
    }
  });

  // Benchmarks
  if (benchmark) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFillColor(249, 250, 251);
    doc.rect(14, finalY, 182, 28, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, finalY, 182, 28, 'D');

    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Market Rate Sourcing & Benchmarking Comparison', 18, finalY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(`Competitor Market Average: INR ${benchmark.average.toLocaleString('en-IN')}`, 18, finalY + 14);
    
    doc.setTextColor(22, 163, 74); // green-600
    doc.setFont('helvetica', 'bold');
    doc.text(`Estimated Savings via FreightQuote: INR ${benchmark.savingsVsAverage.toLocaleString('en-IN')} (${Math.round((benchmark.savingsVsAverage / benchmark.average) * 100)}% lower)`, 18, finalY + 21);
  }

  // Footer note
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('This is a simulated quote based on OSRM routing, NHAI tolls, and current fuel/market tariffs. Final rates may vary on booking.', 14, 285);

  doc.save(`FreightQuote_${quote.mode.toUpperCase()}_FQ-${new Date().getTime().toString().slice(-5)}.pdf`);
}

export function exportToCSV(quote: QuoteResult) {
  const rows = [
    ['Metric/Component', 'Value'],
    ['Mode', quote.mode.toUpperCase()],
    ['Vehicle/Service', quote.vehicle],
    ['Origin', quote.originName],
    ['Destination', quote.destName],
    ['Distance (km)', quote.distanceKm],
    ['Duration (hrs)', quote.durationHrs],
    ['Transit Days', quote.transitDays],
    ['Base Freight (INR)', quote.breakdown.baseFreight],
    ['Fuel Surcharge (INR)', quote.breakdown.fuelSurcharge],
    ['Commodity Risk Adj (INR)', quote.breakdown.commodityAdjustment],
    ['NHAI Tolls (INR)', quote.breakdown.tolls],
    ['Pickup Leg (INR)', quote.breakdown.pickupLastMile],
    ['Delivery Leg (INR)', quote.breakdown.deliveryLastMile],
    ['Entry Tax (INR)', quote.breakdown.entryTax],
    ['Insurance (INR)', quote.breakdown.insurance],
    ['Documentation Fee (INR)', quote.breakdown.documentation],
    ['Total Cost (INR)', quote.total],
    ['Per Kg (INR)', quote.perKg]
  ];

  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `FreightQuote_${quote.mode.toUpperCase()}_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(quote: QuoteResult) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quote, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `FreightQuote_${quote.mode.toUpperCase()}_${new Date().getTime()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

export function exportToExcel(quote: QuoteResult) {
  // Simple XML-based Spreadsheet or tab-delimited Excel format.
  // Tab-delimited (TSV) is automatically read as a native spreadsheet by Excel without format dialog bugs.
  const headers = ['Component', 'Value'];
  const data = [
    ['Mode', quote.mode.toUpperCase()],
    ['Vehicle/Service', quote.vehicle],
    ['Origin', quote.originName],
    ['Destination', quote.destName],
    ['Distance (km)', quote.distanceKm],
    ['Transit Days', quote.transitDays],
    ['Base Freight (INR)', quote.breakdown.baseFreight],
    ['Fuel Surcharge (INR)', quote.breakdown.fuelSurcharge],
    ['Commodity Surcharge (INR)', quote.breakdown.commodityAdjustment],
    ['NHAI Tolls (INR)', quote.breakdown.tolls],
    ['Pickup Leg (INR)', quote.breakdown.pickupLastMile],
    ['Delivery Leg (INR)', quote.breakdown.deliveryLastMile],
    ['Entry Tax (INR)', quote.breakdown.entryTax],
    ['Insurance (INR)', quote.breakdown.insurance],
    ['Documentation Fee (INR)', quote.breakdown.documentation],
    ['Total Cost (INR)', quote.total],
    ['Rate per Kg (INR)', quote.perKg],
  ];

  let excelContent = headers.join('\t') + '\n';
  data.forEach(row => {
    excelContent += row.join('\t') + '\n';
  });

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `FreightQuote_${quote.mode.toUpperCase()}_${new Date().getTime()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
