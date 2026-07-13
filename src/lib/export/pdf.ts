import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { QuoteResponse } from "@/lib/api/contracts";

interface AutoTablePDF extends jsPDF {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoTable: (options: any) => void;
}

export function exportQuoteToPDF(
  results: QuoteResponse,
  originStr: string,
  destStr: string,
  weight: number,
  weightUnit: string,
  commodity: string,
  mode: string
) {
  const doc = new jsPDF() as AutoTablePDF;
  const timestamp = new Date().toLocaleString("en-IN");
  
  // Extract road quote details for tolls/distance if available
  const roadQuote = results.quotes.road;
  const hasRoad = roadQuote && !("error" in roadQuote);
  const distanceKm = hasRoad ? roadQuote.distanceKm : 0;
  const tollPlazas = hasRoad ? (roadQuote.tollPlazas || []) : [];

  // Page 1: Executive Summary & Mode Analysis
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39); // Gray 900
  doc.text("FREIGHT INSTRUMENT ANALYSIS", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // Gray 500
  doc.text(`Generated: ${timestamp} | Mode Scope: ${mode.toUpperCase()}`, 14, 26);
  
  // Horizontal Rule
  doc.setDrawColor(229, 231, 235); // Gray 200
  doc.line(14, 30, 196, 30);
  
  // Section 1: Lane Context
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text("1. Lane & Cargo Specifications", 14, 40);
  
  const specificationsData = [
    ["Origin Pincode", originStr, "Destination Pincode", destStr],
    ["Cargo Weight", `${weight} ${weightUnit.toUpperCase()}`, "Commodity Classification", commodity],
    ["Active Routing Distance", `${distanceKm} km`, "Estimated Total Toll Plazas", `${tollPlazas.length}`],
  ];
  
  doc.autoTable({
    startY: 45,
    head: [],
    body: specificationsData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [107, 114, 128], width: 45 },
      1: { textColor: [17, 24, 39], width: 50 },
      2: { fontStyle: "bold", textColor: [107, 114, 128], width: 45 },
      3: { textColor: [17, 24, 39], width: 50 },
    },
  });
  
  // Section 2: Mode Pricing Summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yPosition = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("2. Comparative Modal Quotes", 14, yPosition);
  
  const modesHead = [["Mode of Transit", "Base Rate", "Surcharges", "Toll Cost", "GST Amount", "Net Total"]];
  const modesBody = Object.entries(results.quotes).map(([m, quote]) => {
    if ("error" in quote) {
      return [m.toUpperCase(), "N/A", "N/A", "N/A", "N/A", "N/A"];
    }

    const base = quote.breakdown.baseFreight;
    const surcharges = 
      quote.breakdown.fuelSurcharge +
      quote.breakdown.commodityAdjustment +
      quote.breakdown.pickupLastMile +
      quote.breakdown.deliveryLastMile +
      quote.breakdown.entryTax +
      quote.breakdown.insurance +
      quote.breakdown.documentation;
    const tollsCost = quote.breakdown.tolls;
    const gst = Math.round(quote.total * 0.18);
    const totalWithGst = quote.total + gst;

    return [
      m.toUpperCase(),
      `INR ${base.toLocaleString("en-IN")}`,
      `INR ${surcharges.toLocaleString("en-IN")}`,
      `INR ${tollsCost.toLocaleString("en-IN")}`,
      `INR ${gst.toLocaleString("en-IN")}`,
      `INR ${totalWithGst.toLocaleString("en-IN")}`,
    ];
  });
  
  doc.autoTable({
    startY: yPosition + 5,
    head: modesHead,
    body: modesBody,
    theme: "striped",
    headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: "bold" }, // Cyan 500
    styles: { fontSize: 9, cellPadding: 4 },
  });
  
  // Add new page for toll plaza audit log if road mode was calculated
  if (tollPlazas.length > 0) {
    doc.addPage();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    doc.text("3. NHAI Toll Plaza Audit breakdown", 14, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("Itemized highway plazas calculated using standard axle rate configuration multipliers.", 14, 25);
    
    const tollsHead = [["#", "Plaza Name", "State", "Axle Count", "Base Rate", "GST", "Total Charge"]];
    const tollsBody = tollPlazas.map((t, idx) => {
      const axleRate = t.tollAmount || 0;
      const gstAmt = Math.round(axleRate * 0.18);
      const totCharge = axleRate + gstAmt;
      return [
        (idx + 1).toString(),
        t.name,
        t.state,
        "4-6 Axles",
        `INR ${axleRate}`,
        `INR ${gstAmt} (18%)`,
        `INR ${totCharge}`,
      ];
    });
    
    const totalBaseTolls = tollPlazas.reduce((acc, curr) => acc + (curr.tollAmount || 0), 0);
    const totalGstTolls = Math.round(totalBaseTolls * 0.18);
    const finalTollSum = totalBaseTolls + totalGstTolls;
    
    tollsBody.push([
      "",
      "SUBTOTALS",
      "",
      "",
      `INR ${totalBaseTolls.toLocaleString("en-IN")}`,
      `INR ${totalGstTolls.toLocaleString("en-IN")}`,
      `INR ${finalTollSum.toLocaleString("en-IN")}`,
    ]);
    
    doc.autoTable({
      startY: 30,
      head: tollsHead,
      body: tollsBody,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" }, // Indigo 600
      styles: { fontSize: 8, cellPadding: 3 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.row.index === tollsBody.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [243, 244, 246]; // Gray 100
        }
      },
    });
  }
  
  doc.save(`Quote_Report_${originStr}_to_${destStr}.pdf`);
}
