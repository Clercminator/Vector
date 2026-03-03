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

  const result = blueprint.result as any;
  const displayTitle = result?.shortTitle ? String(result.shortTitle) : blueprint.title;
  const frameworkLabel = String(blueprint.framework || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // --- COVER PAGE ---
  fillBackground();
  const centerX = pageWidth / 2;
  let coverY = pageHeight * 0.3;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  setPrimary();
  const coverTitleLines = doc.splitTextToSize(displayTitle, contentWidth);
  coverTitleLines.forEach((line: string) => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, centerX - lineWidth / 2, coverY);
    coverY += 12;
  });
  coverY += 16;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  setMuted();
  doc.text(frameworkLabel, centerX - doc.getTextWidth(frameworkLabel) / 2, coverY);
  coverY += 10;
  doc.text(new Date(blueprint.createdAt).toLocaleDateString(), centerX - doc.getTextWidth(new Date(blueprint.createdAt).toLocaleDateString()) / 2, coverY);
  coverY += 24;
  doc.setFontSize(10);
  setMuted();
  doc.text("Your personalized plan", centerX - doc.getTextWidth("Your personalized plan") / 2, coverY);

  addNewPage();
  setBody();

  // Helper: ensure space for at least minLines, add new page if needed
  const ensureSpace = (minLines = 5) => {
    if (y > pageHeight - margin - minLines * 7) addNewPage();
  };

  // Helper: render a section (heading + content)
  const renderSection = (heading: string, content: string | string[], options?: { indent?: boolean }) => {
    ensureSpace(8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text(heading, margin, y);
    setBody();
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const indent = options?.indent !== false ? 5 : 0;
    const items = Array.isArray(content) ? content : [content];
    items.forEach(item => {
      if (!item?.trim()) return;
      const lines = doc.splitTextToSize(item, contentWidth - indent);
      lines.forEach((line: string) => {
        ensureSpace(1);
        doc.text(line, margin + indent, y);
        y += 5;
      });
      y += 2;
    });
    y += 6;
  };

  // --- EXECUTIVE SUMMARY ---
  if (result?.executiveSummary) {
    renderSection("Executive Summary", result.executiveSummary);
  }

  // --- DIFFICULTY & COMMITMENT ---
  if (result?.difficulty || result?.difficultyReason || result?.commitment) {
    ensureSpace(6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text("Difficulty & Commitment", margin, y);
    setBody();
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const parts: string[] = [];
    if (result.difficulty) parts.push(`Level: ${String(result.difficulty).replace(/\b\w/g, c => c.toUpperCase())}`);
    if (result.commitment) parts.push(`Estimated: ${result.commitment}`);
    if (parts.length > 0) {
      doc.text(parts.join(" · "), margin, y);
      y += 6;
    }
    if (result.difficultyReason) {
      const drLines = doc.splitTextToSize(result.difficultyReason, contentWidth);
      drLines.forEach((line: string) => { doc.text(line, margin, y); y += 5; });
      y += 4;
    }
    y += 8;
  }

  // --- YOUR SITUATION (parsed from answers) ---
  const firstAnswer = blueprint.answers[0] || "";
  const situationParts: string[] = [];
  const goalMatch = firstAnswer.match(/(?:Goal|Objective|Objetivo)\s*:?\s*([^.]+)/i);
  if (goalMatch?.[1]?.trim()) {
    situationParts.push(`Goal: ${goalMatch[1].trim()}`);
  } else if (/Stakes?|Time horizon|Horizonte|Obstacles?/i.test(firstAnswer)) {
    const before = firstAnswer.split(/\s*Stakes?|Time horizon|Horizonte\s*:?\s*/i)[0]?.trim();
    if (before?.length > 5) situationParts.push(`Goal: ${before}`);
  }
  const stakesMatch = firstAnswer.match(/(?:Stakes?|Apuesta)\s*:?\s*([^.]+)/i);
  const horizonMatch = firstAnswer.match(/(?:Time horizon|Horizon|Horizonte temporal)\s*:?\s*([^.]+)/i);
  const obstaclesMatch = firstAnswer.match(/(?:Obstacles?|Obstáculos?|Constraints?)\s*:?\s*([^.]+)/i);
  if (goalMatch?.[1]?.trim()) situationParts.push(`Goal: ${goalMatch[1].trim()}`);
  if (stakesMatch?.[1]?.trim()) situationParts.push(`Stakes: ${stakesMatch[1].trim()}`);
  if (horizonMatch?.[1]?.trim()) situationParts.push(`Timeline: ${horizonMatch[1].trim()}`);
  if (obstaclesMatch?.[1]?.trim()) situationParts.push(`Constraints: ${obstaclesMatch[1].trim()}`);
  if (situationParts.length === 0 && firstAnswer.trim()) {
    situationParts.push(firstAnswer.slice(0, 300) + (firstAnswer.length > 300 ? "…" : ""));
  }
  if (situationParts.length > 0) {
    renderSection("Your Situation", situationParts);
  }

  // --- YOUR WHY ---
  const yourWhy = result?.yourWhy || (result?.type === "rpm" && result?.purpose ? result.purpose : null);
  if (yourWhy) {
    renderSection("Your Why", yourWhy);
  }

  // --- FIRST WEEK ACTIONS ---
  const firstWeek = result?.firstWeekActions;
  if (Array.isArray(firstWeek) && firstWeek.length > 0) {
    renderSection("First Week Actions", firstWeek.map((a: string, i: number) => `${i + 1}. ${a}`));
  }

  // --- MILESTONES / CHECKPOINTS ---
  const milestones = result?.milestones;
  if (Array.isArray(milestones) && milestones.length > 0) {
    renderSection("Milestones", milestones.map((m: string) => `• ${m}`));
  }

  // --- SUCCESS CRITERIA ---
  const successCriteria = result?.successCriteria;
  const successMatch = !successCriteria && firstAnswer ? firstAnswer.match(/(?:Success looks like|Éxito)\s*:?\s*([^.]+)/i) : null;
  const successText = successCriteria || (successMatch?.[1]?.trim() ? `You'll know you've succeeded when: ${successMatch[1].trim()}` : null);
  if (successText) {
    renderSection("Success Criteria", successText);
  }

  // --- WHAT TO AVOID ---
  const whatToAvoid = result?.whatToAvoid;
  let avoidItems: string[] = [];
  if (Array.isArray(whatToAvoid) && whatToAvoid.length > 0) {
    avoidItems = whatToAvoid;
  } else if (result?.type === "pareto" && result.trivial?.length) {
    avoidItems = result.trivial;
  } else if (result?.type === "eisenhower") {
    avoidItems = [...(result.q3 || []), ...(result.q4 || [])];
  } else if (result?.type === "gps" && result.anti_goals?.length) {
    avoidItems = result.anti_goals;
  }
  if (avoidItems.length > 0) {
    renderSection("What to Avoid", avoidItems.map(a => `• ${a}`));
  }

  // Divider before Blueprint Result
  setDrawBorder();
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  setBody();

  // Result Section
  if (blueprint.result) {
    ensureSpace(10);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text("Blueprint Result", margin, y);
    setBody();
    y += 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

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
             const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
             lines.forEach((line: string) => { doc.text(line, margin + 5, y); y += 6; });
        });
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Trivial Many (80%):", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.trivial || []).forEach((item: string) => {
             const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
             lines.forEach((line: string) => { doc.text(line, margin + 5, y); y += 6; });
        });
    }
    else if (result.type === 'rpm') {
        doc.setFont("helvetica", "bold");
        setPrimary();
        const resultLines = doc.splitTextToSize(`Result: ${result.result || ""}`, contentWidth);
        resultLines.forEach((line: string) => { doc.text(line, margin, y); y += 6; });
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
            const lines = doc.splitTextToSize(`${i+1}. ${item}`, contentWidth - 10);
            lines.forEach((line: string) => { doc.text(line, margin + 5, y); y += 6; });
        });
    }
    else if (result.type === 'eisenhower') {
        const renderQuadrant = (title: string, items: string[]) => {
            ensureSpace(6);
            doc.setFont("helvetica", "bold");
            setPrimary();
            doc.text(title, margin, y);
            setBody();
            y += 7;
            doc.setFont("helvetica", "normal");
            if (items.length === 0) {
                setMuted();
                doc.text("(None)", margin + 5, y);
                setBody();
                y += 6;
            } else {
                items.forEach(it => {
                    const itemLines = doc.splitTextToSize(`• ${it}`, contentWidth - 10);
                    itemLines.forEach((line: string) => {
                        doc.text(line, margin + 5, y);
                        y += 6;
                    });
                });
            }
            y += 6;
        };
        renderQuadrant("Urgent & Important (Do)", result.q1 || []);
        renderQuadrant("Important Not Urgent (Schedule)", result.q2 || []);
        renderQuadrant("Urgent Not Important (Delegate)", result.q3 || []);
        renderQuadrant("Neither (Eliminate)", result.q4 || []);
    }
    else if (result.type === 'okr') {
        doc.setFont("helvetica", "bold");
        setPrimary();
        const objLines = doc.splitTextToSize(`Objective: ${result.objective || ""}`, contentWidth);
        objLines.forEach((line: string) => { doc.text(line, margin, y); y += 6; });
        setBody();
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Key Results:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.keyResults || []).forEach((kr: string, i: number) => {
            const lines = doc.splitTextToSize(`${i+1}. ${kr}`, contentWidth - 10);
            lines.forEach((line: string) => { doc.text(line, margin + 5, y); y += 6; });
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
    else if (result.type === 'ikigai') {
        const ik = result as { purpose?: string; love?: string; goodAt?: string; worldNeeds?: string; paidFor?: string };
        if (ik.purpose) {
            doc.setFont("helvetica", "bold");
            setPrimary();
            doc.text("Your Ikigai (Purpose):", margin, y);
            setBody();
            y += 8;
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(ik.purpose, contentWidth);
            doc.text(lines, margin + 5, y);
            y += lines.length * 6 + 8;
        }
        for (const [label, val] of [
            ["What you love", ik.love],
            ["What you're good at", ik.goodAt],
            ["What the world needs", ik.worldNeeds],
            ["What you can be paid for", ik.paidFor],
        ]) {
            if (val) {
                doc.setFont("helvetica", "bold");
                setPrimary();
                doc.text(`${label}:`, margin, y);
                setBody();
                y += 6;
                doc.setFont("helvetica", "normal");
                const textLines = doc.splitTextToSize(val, contentWidth);
                doc.text(textLines, margin + 5, y);
                y += textLines.length * 6 + 6;
            }
        }
        y += 6;
    }
  }

  y += 14;

  // Page break before Q&A if result section was long
  if (y > pageHeight - 80) {
    addNewPage();
  }

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

  // Helper to format structured answers (e.g. "Goal: X. Stakes: Y." or multi-line → bullet-style)
  const formatAnswer = (text: string): string[] => {
    const trimmed = (text || "").trim();
    if (!trimmed) return [];
    // Split by newlines first
    const byLines = trimmed.split(/\n+/).map(s => s.replace(/^[\s•\-]+\s*/, "").trim()).filter(Boolean);
    if (byLines.length > 1) return byLines;
    // Split by ". " to get sentences (e.g. "Goal: X. Stakes: Y. Obstacles: Z" → 3 bullets)
    const bySentence = trimmed.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 2);
    if (bySentence.length > 1) return bySentence.map(s => (s.endsWith(".") ? s : s + "."));
    return [trimmed];
  };

  blueprint.answers.forEach((ans, i) => {
      doc.setFont("helvetica", "bold");
      setPrimary();
      doc.text(`Answer ${i + 1}:`, margin, y);
      setBody();
      y += 7;
      doc.setFont("helvetica", "normal");
      const segments = formatAnswer(ans);
      if (segments.length > 1) {
        segments.forEach(seg => {
          const lines = doc.splitTextToSize(`• ${seg}`, contentWidth - 10);
          lines.forEach((line: string) => {
            doc.text(line, margin + 5, y);
            y += 5;
          });
        });
      } else {
        const lines = doc.splitTextToSize(ans, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5;
      }
      y += 10;

      if (y > pageHeight - 40) {
          addNewPage();
      }
  });

  // Footer: Vector wordmark + page numbers on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      setMuted();
      doc.text("Vector", margin, pageHeight - 12);
      doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin - doc.getTextWidth(`Page ${p} of ${pageCount}`), pageHeight - 12);
  }

  return doc;
};

export const exportToPdf = async (blueprint: Blueprint, branding?: PdfBranding) => {
    const doc = await generatePdf(blueprint, branding);
    doc.save(`vector-blueprint-${blueprint.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
