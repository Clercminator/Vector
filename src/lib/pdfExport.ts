import { jsPDF } from "jspdf";
import { Blueprint } from "@/lib/blueprints";

export interface PdfBranding {
  logoUrl?: string;
  primaryColor?: string; // Hex code
}

// Helper to load image
const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No ctx');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (e) => reject(e);
    });
};

export const generatePdf = async (blueprint: Blueprint, branding?: PdfBranding): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Branding: Logo
  if (branding?.logoUrl) {
      try {
          const imgData = await loadImage(branding.logoUrl);
          // Scale to max height 15
          doc.addImage(imgData, 'PNG', margin, y, 15, 15); 
          // Move text to right if logo exists? or just put logo above. simpler above.
          y += 20;
      } catch (e) {
          console.warn("Failed to load logo", e);
      }
  }

  // Branding: Color
  const primaryColor = branding?.primaryColor || '#000000';

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text(blueprint.title, margin, y);
  y += 15;

  // Meta info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Framework: ${blueprint.framework}`, margin, y);
  doc.text(`Created: ${new Date(blueprint.createdAt).toLocaleDateString()}`, pageWidth - margin - 50, y);
  y += 15;

  // Divider
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y - 5, pageWidth - margin, y - 5);
  y += 5;

  doc.setTextColor(0);

  // Result Section
  if (blueprint.result) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text("Blueprint Result", margin, y);
    doc.setTextColor(0); // reset
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const result = blueprint.result as any;

    if (result.type === 'first-principles') {
       doc.setFont("helvetica", "bold");
       doc.text("Fundamental Truths:", margin, y);
       y += 7;
       doc.setFont("helvetica", "normal");
       (result.truths || []).forEach((t: string, i: number) => {
           const lines = doc.splitTextToSize(`${i+1}. ${t}`, contentWidth);
           doc.text(lines, margin, y);
           y += lines.length * 7;
       });
       y += 5;
       doc.setFont("helvetica", "bold");
       doc.text("New Approach:", margin, y);
       y += 7;
       doc.setFont("helvetica", "normal");
       const lines = doc.splitTextToSize(result.newApproach || "", contentWidth);
       doc.text(lines, margin, y);
       y += lines.length * 7 + 10;
    } 
    else if (result.type === 'pareto') {
        doc.setFont("helvetica", "bold");
        doc.text("Vital Few (20%):", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        (result.vital || []).forEach((item: string) => {
             doc.text(`• ${item}`, margin + 5, y);
             y += 6;
        });
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Trivial Many (80%):", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        (result.trivial || []).forEach((item: string) => {
             doc.text(`• ${item}`, margin + 5, y);
             y += 6;
        });
    }
    else if (result.type === 'rpm') {
        doc.setFont("helvetica", "bold");
        doc.text(`Result: ${result.result}`, margin, y);
        y += 10;
        doc.text("Purpose:", margin, y);
        y += 7;
        doc.setFont("helvetica", "italic");
        const pLines = doc.splitTextToSize(result.purpose || "", contentWidth);
        doc.text(pLines, margin + 5, y);
        y += pLines.length * 7 + 5;
        
        doc.setFont("helvetica", "bold");
        doc.text("Massive Action Plan:", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        (result.plan || []).forEach((item: string, i: number) => {
            doc.text(`${i+1}. ${item}`, margin + 5, y);
            y += 6;
        });
    }
    else if (result.type === 'eisenhower') {
        const renderQuadrant = (title: string, items: string[]) => {
            doc.setFont("helvetica", "bold");
            doc.text(title, margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            if (items.length === 0) {
                doc.text("(None)", margin + 5, y);
                y += 6;
            } else {
                items.forEach(it => {
                    doc.text(`• ${it}`, margin + 5, y);
                    y += 6;
                });
            }
            y += 4;
        };
        renderQuadrant("Urgent & Important (Do)", result.q1 || []);
        renderQuadrant("Important Not Urgent (Schedule)", result.q2 || []);
        renderQuadrant("Urgent Not Important (Delegate)", result.q3 || []);
        renderQuadrant("Neither (Eliminate)", result.q4 || []);
    }
    else if (result.type === 'okr') {
        doc.setFont("helvetica", "bold");
        doc.text(`Objective: ${result.objective}`, margin, y);
        y += 10;
        doc.text("Key Results:", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        (result.keyResults || []).forEach((kr: string, i: number) => {
            doc.text(`${i+1}. ${kr}`, margin + 5, y);
            y += 6;
        });
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`Initiative: ${result.initiative}`, margin, y);
        y += 10;
    }
  }

  y += 10;
  
  // Q&A Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("Q&A History", margin, y);
  doc.setTextColor(0);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  blueprint.answers.forEach((ans, i) => {
      // Just showing answers since questions are static/implicit in blueprint logic often, 
      // or we can fetch them if available. For now just answers.
      doc.setFont("helvetica", "bold");
      doc.text(`Answer ${i+1}:`, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(ans, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 5;
      
      if (y > 270) {
          doc.addPage();
          y = margin;
      }
  });

  return doc;
};

export const exportToPdf = async (blueprint: Blueprint, branding?: PdfBranding) => {
    const doc = await generatePdf(blueprint, branding);
    doc.save(`vector-blueprint-${blueprint.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
