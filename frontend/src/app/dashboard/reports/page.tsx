"use client";

import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import { FileDown, FileJson, FileText, DownloadCloud, Activity } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportGeneration() {
  const { result, uploadInfo } = useAnalysis();

  if (!result) {
    return <div className="flex h-[50vh] items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground border border-border bg-card rounded-md border-dashed">Awaiting document ingestion to populate telemetry grid.</div>;
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `legal_analysis_${result.document.document_id}.json`);
    dlAnchorElem.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Enterprise PDF styling (Flat, strict geometries)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(24, 24, 27); // zinc-900
    doc.text("Legal Contract Analysis Report", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122); // zinc-500
    doc.text(`Document: ${result.document.filename || uploadInfo?.filename || 'Unknown'}`, 14, 32);
    doc.text(`Pages Analyzed: ${result.document.pages || uploadInfo?.pages || '?'}   |   Total Clauses: ${result.document.total_clauses}`, 14, 38);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 44);
    
    doc.setDrawColor(228, 228, 231); // zinc-200
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);
    
    // Risk Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27); 
    doc.text("Risk Intelligence Summary", 14, 60);
    
    const riskY = 68;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const rl = result.summary.risk_level;
    if (rl === 'high') doc.setTextColor(239, 68, 68);
    else if (rl === 'medium') doc.setTextColor(245, 158, 11);
    else doc.setTextColor(16, 185, 129);
    doc.text(`Overall Risk Level: ${rl.toUpperCase()} (${result.summary.overall_risk_score}/100)`, 14, riskY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(113, 113, 122);
    doc.text(`High Risk Clauses: ${result.summary.high_risk_count}`, 14, riskY + 8);
    doc.text(`Medium Risk Clauses: ${result.summary.medium_risk_count}`, 14, riskY + 16);
    doc.text(`Low Risk Clauses: ${result.summary.low_risk_count}`, 14, riskY + 24);

    let nextY = riskY + 36;
    const missingClauses = (result as any).missing_clauses || ["Confidentiality", "Dispute Resolution"];
    
    if (missingClauses.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27);
      doc.text("Critically Missing Provisions", 14, nextY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68); 
      const missingText = doc.splitTextToSize(`The following standard clauses were not detected: ${missingClauses.join(', ')}. This presents an organizational liability gap.`, 170);
      doc.text(missingText, 14, nextY + 8);
      nextY += (missingText.length * 6) + 12;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text("Key Entities Extracted", 14, nextY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(`Organizations: ${result.entities.parties.join(', ') || 'None found'}`, 14, nextY + 8);
    doc.text(`Jurisdictions: ${result.entities.jurisdictions?.join(', ') || 'None found'}`, 14, nextY + 14);
    doc.text(`Monetary: ${result.entities.amounts.join(', ') || 'None found'}`, 14, nextY + 20);
    nextY += 30;

    const tableData = result.clauses.map(c => [
      c.id.toString(),
      c.type,
      c.risk_level.toUpperCase(),
      (c.confidence * 100).toFixed(0) + "%",
      c.is_unfair ? "Yes" : "No",
      c.text.length > 80 ? c.text.substring(0, 80) + "..." : c.text
    ]);

    autoTable(doc, {
      startY: nextY,
      head: [['ID', 'Classification', 'Risk', 'Conf', 'Unfair', 'Excerpt']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27], fontSize: 8 }, // zinc-900 head
      bodyStyles: { fontSize: 7, textColor: [113, 113, 122] }, // zinc-500 body
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 18 },
        3: { cellWidth: 12 },
        4: { cellWidth: 12 },
        5: { cellWidth: 'auto' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
           const r = data.cell.raw;
           if (r === 'HIGH') data.cell.styles.textColor = [239, 68, 68];
           else if (r === 'MEDIUM') data.cell.styles.textColor = [245, 158, 11];
           else data.cell.styles.textColor = [16, 185, 129];
           data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`Legal_Analysis_Report_${result.document.document_id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <AnimatedContainer animation="fade-in" duration={0.2} className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
           <DownloadCloud className="w-5 h-5 text-muted-foreground" />
           Compliance Audit Export
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Format generated inference telemetry into portable organizational formats.
        </p>
      </AnimatedContainer>

      <AnimatedContainer animation="slide-up" staggerChildren={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* PDF Export */}
        <button 
          onClick={handleExportPDF}
          className="glass-panel p-5 rounded-md flex flex-col text-left group hover:border-primary/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
        >
           <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
             <FileDown className="w-5 h-5 text-primary shrink-0" />
             <div>
               <h3 className="text-sm font-semibold text-foreground leading-none">PDF Report</h3>
               <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 block">Executive Summary</span>
             </div>
           </div>
           <p className="text-xs text-muted-foreground leading-relaxed flex-1">
             Paginated visual matrix containing overarching risk indicators, semantic missing clauses, and full token telemetry suitable for corporate counsel review.
           </p>
           <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Initiate Download <Activity className="w-3 h-3" />
           </div>
        </button>

        {/* JSON Export */}
        <button 
          onClick={handleExportJSON}
          className="glass-panel p-5 rounded-md flex flex-col text-left group hover:border-violet-500/50 transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
           <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
             <FileJson className="w-5 h-5 text-violet-500 shrink-0" />
             <div>
               <h3 className="text-sm font-semibold text-foreground leading-none">Raw JSON Matrix</h3>
               <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 block">API Telemetry Dump</span>
             </div>
           </div>
           <p className="text-xs text-muted-foreground leading-relaxed flex-1">
             Standardized unadulterated payload containing precise node confidence percentages, relationship arrays, and UUID parameters required for automated CI/CD pipeline injections.
           </p>
           <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-violet-500 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Initiate Download <Activity className="w-3 h-3" />
           </div>
        </button>

        {/* CSV Export */}
        <button 
          disabled
          className="glass-panel p-5 rounded-md flex flex-col text-left opacity-60 cursor-not-allowed border-dashed"
        >
           <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
             <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
             <div className="flex-1">
               <h3 className="text-sm font-semibold text-foreground leading-none flex items-center justify-between">
                 CSV Flatfile
                 <span className="text-[9px] uppercase tracking-widest font-bold bg-muted px-1.5 py-0.5 rounded border border-border">Soon</span>
               </h3>
               <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 block">Spreadsheet Ingest</span>
             </div>
           </div>
           <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-6">
             Comma-separated data structure mapping extracted taxonomies to billing systems and external HR platforms utilizing standard delimiting patterns.
           </p>
        </button>

      </AnimatedContainer>
    </div>
  );
}
