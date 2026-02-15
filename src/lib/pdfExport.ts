import { jsPDF } from "jspdf";
import { Blueprint } from "@/lib/blueprints";

/** Vector app theme (from theme.css) — used when branding is not provided */
const VECTOR_THEME = {
  primary: [255, 255, 255] as [number, number, number],   // #FFFFFF (White text)
  muted: [161, 161, 170] as [number, number, number],     // #A1A1AA (Zinc-400 equivalent for muted)
  border: [51, 51, 51],                                   // #333333 (Dark border)
  background: [17, 17, 17] as [number, number, number],   // #111111 (Dark background)
  body: [228, 228, 231] as [number, number, number],      // #E4E4E7 (Zinc-200 for body text)
};

export interface PdfBranding {
  logoUrl?: string;
  primaryColor?: string; // Hex code
}

// Helper: parse hex to R,G,B for jsPDF
function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace(/^#/, "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return [r, g, b];
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Vector theme colors (branding overrides primary only when provided)
  const primaryRgb = branding?.primaryColor ? hexToRgb(branding.primaryColor) : VECTOR_THEME.primary;
  const mutedRgb = VECTOR_THEME.muted;
  const bgRgb = VECTOR_THEME.background;

  const setPrimary = () => doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  const setMuted = () => doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
  const setBody = () => doc.setTextColor(VECTOR_THEME.body[0], VECTOR_THEME.body[1], VECTOR_THEME.body[2]);
  const setDrawPrimary = () => doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  const setDrawBorder = () => doc.setDrawColor(VECTOR_THEME.border[0], VECTOR_THEME.border[1], VECTOR_THEME.border[2]);

  // Helper to fill background
  const fillBackground = () => {
      doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // Helper to add new page with background
  const addNewPage = () => {
      doc.addPage();
      fillBackground();
      y = margin;
  };

  // Initial page background
  fillBackground();

  // Branding: Logo
  if (branding?.logoUrl) {
      try {
          const imgData = await loadImage(branding.logoUrl);
          doc.addImage(imgData, 'PNG', margin, y, 18, 18);
          y += 22;
      } catch (e) {
          console.warn("Failed to load logo", e);
      }
  }

  // Title — Vector primary
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  setPrimary();
  doc.text(blueprint.title, margin, y);
  y += 12;

  // Meta — Vector muted
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setMuted();
  doc.text(`Framework: ${blueprint.framework}`, margin, y);
  doc.text(`Created: ${new Date(blueprint.createdAt).toLocaleDateString()}`, pageWidth - margin - 55, y);
  y += 14;

  // Divider — Vector border
  setDrawBorder();
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  setBody();

  // Result Section
  if (blueprint.result) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text("Blueprint Result", margin, y);
    setBody();
    y += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const result = blueprint.result as any;

    if (result.type === 'first-principles') {
       doc.setFont("helvetica", "bold");
       setPrimary();
       doc.text("Fundamental Truths:", margin, y);
       setBody();
       y += 8;
       doc.setFont("helvetica", "normal");
       (result.truths || []).forEach((t: string, i: number) => {
           const lines = doc.splitTextToSize(`${i+1}. ${t}`, contentWidth);
           doc.text(lines, margin, y);
           y += lines.length * 7;
       });
       y += 5;
       doc.setFont("helvetica", "bold");
       setPrimary();
       doc.text("New Approach:", margin, y);
       setBody();
       y += 8;
       doc.setFont("helvetica", "normal");
       const lines = doc.splitTextToSize(result.newApproach || "", contentWidth);
       doc.text(lines, margin, y);
       y += lines.length * 7 + 12;
    }
    else if (result.type === 'pareto') {
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Vital Few (20%):", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.vital || []).forEach((item: string) => {
             doc.text(`• ${item}`, margin + 5, y);
             y += 6;
        });
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Trivial Many (80%):", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.trivial || []).forEach((item: string) => {
             doc.text(`• ${item}`, margin + 5, y);
             y += 6;
        });
    }
    else if (result.type === 'rpm') {
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text(`Result: ${result.result}`, margin, y);
        setBody();
        y += 10;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Purpose:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "italic");
        const pLines = doc.splitTextToSize(result.purpose || "", contentWidth);
        doc.text(pLines, margin + 5, y);
        y += pLines.length * 7 + 5;
        
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Massive Action Plan:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.plan || []).forEach((item: string, i: number) => {
            doc.text(`${i+1}. ${item}`, margin + 5, y);
            y += 6;
        });
    }
    else if (result.type === 'eisenhower') {
        const renderQuadrant = (title: string, items: string[]) => {
            doc.setFont("helvetica", "bold");
            setPrimary();
            doc.text(title, margin, y);
            setBody();
            y += 7;
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
        setPrimary();
        doc.text(`Objective: ${result.objective}`, margin, y);
        setBody();
        y += 10;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Key Results:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.keyResults || []).forEach((kr: string, i: number) => {
            doc.text(`${i+1}. ${kr}`, margin + 5, y);
            y += 6;
        });
        y += 5;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text(`Initiative: ${result.initiative}`, margin, y);
        setBody();
        y += 10;
    }
    else if (result.type === 'dsss') {
        const dsss = result as { objective?: string; deconstruct?: string[]; selection?: string[]; sequence?: string[]; stakes?: string };
        if (dsss.objective) {
            doc.setFont("helvetica", "bold");
            setPrimary();
            doc.text(`Objective: ${dsss.objective}`, margin, y);
            setBody();
            y += 10;
        }
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Deconstruct:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (dsss.deconstruct || []).forEach((item: string) => {
            const lines = doc.splitTextToSize(`• ${item}`, contentWidth);
            doc.text(lines, margin + 5, y);
            y += lines.length * 6;
        });
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Selection (20% for 80%):", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (dsss.selection || []).forEach((item: string) => {
            const lines = doc.splitTextToSize(`• ${item}`, contentWidth);
            doc.text(lines, margin + 5, y);
            y += lines.length * 6;
        });
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Sequence:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (dsss.sequence || []).forEach((item: string, i: number) => {
            const lines = doc.splitTextToSize(`${i + 1}. ${item}`, contentWidth);
            doc.text(lines, margin + 5, y);
            y += lines.length * 6;
        });
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Stakes:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        const stakesLines = doc.splitTextToSize(dsss.stakes || "", contentWidth);
        doc.text(stakesLines, margin + 5, y);
        y += stakesLines.length * 6 + 12;
    }
  }

  y += 14;

  // Divider before Q&A
  setDrawBorder();
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Q&A Section — Vector theme
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  setPrimary();
  doc.text("Q&A History", margin, y);
  setBody();
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  blueprint.answers.forEach((ans, i) => {
      doc.setFont("helvetica", "bold");
      setMuted();
      doc.text(`Answer ${i + 1}:`, margin, y);
      setBody();
      y += 6;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(ans, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;

      if (y > pageHeight - 30) {
          addNewPage();
      }
  });

  // Footer: Vector wordmark (muted) at bottom of last page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      setMuted();
      doc.text("Vector", margin, pageHeight - 12);
  }

  return doc;
};

export const exportToPdf = async (blueprint: Blueprint, branding?: PdfBranding) => {
    const doc = await generatePdf(blueprint, branding);
    doc.save(`vector-blueprint-${blueprint.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
