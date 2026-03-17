import { jsPDF } from "jspdf";
import { Blueprint } from "@/lib/blueprints";

/**
 * PDF Export Format Parity
 * ------------------------
 * Full layout (matches in-app visualization): first-principles, pareto, rpm, okr, eisenhower, dsss, misogi, ikigai
 * Simplified (bullet lists / text): mandalas — app uses spatial grid; PDF uses structured lists
 * All frameworks include: cover, executive summary, difficulty, your situation, your why,
 * first week actions, milestones, success criteria, what to avoid, blueprint result, Q&A history
 */

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

/** Options for PDF generation (localization, personalization, Q&A) */
export interface PdfOptions {
  /** Language code (en, es, pt, fr, de) for labels */
  language?: string;
  /** User display name for "Plan Personalizado para {user}" */
  userName?: string;
  /** Full chat messages (ai/user) to build Q&A pairs; also used to filter out system-injected answers */
  messages?: Array<{ role: string; content: string }>;
}

// Simple labels by language for PDF (no React/i18n dependency)
const PDF_LABELS: Record<string, Record<string, string>> = {
  en: {
    personalizedPlan: "Your personalized plan",
    personalizedPlanFor: "Personalized plan for {0}",
    executiveSummary: "Executive Summary",
    difficultyCommitment: "Difficulty & Commitment",
    yourSituation: "Your Situation",
    yourWhy: "Your Why",
    firstWeekActions: "First Week Actions",
    milestones: "Milestones",
    successCriteria: "Success Criteria",
    whatToAvoid: "What to Avoid",
    blueprintResult: "Blueprint Result",
    qaHistory: "Q&A History",
    question: "Question",
    answer: "Answer",
    urgentImportant: "Urgent & Important (Do)",
    importantNotUrgent: "Important Not Urgent (Schedule)",
    urgentNotImportant: "Urgent Not Important (Delegate)",
    neither: "Neither (Eliminate)",
  },
  es: {
    personalizedPlan: "Tu plan personalizado",
    personalizedPlanFor: "Plan Personalizado para {0}",
    executiveSummary: "Resumen Ejecutivo",
    difficultyCommitment: "Dificultad y Compromiso",
    yourSituation: "Tu Situación",
    yourWhy: "Tu Porqué",
    firstWeekActions: "Acciones de la Primera Semana",
    milestones: "Hitos",
    successCriteria: "Criterios de Éxito",
    whatToAvoid: "Qué Evitar",
    blueprintResult: "Resultado del Plan",
    qaHistory: "Historial Preguntas y Respuestas",
    question: "Pregunta",
    answer: "Respuesta",
    urgentImportant: "Urgente e Importante (Hacer)",
    importantNotUrgent: "Importante No Urgente (Agendar)",
    urgentNotImportant: "Urgente No Importante (Delegar)",
    neither: "Ninguno (Eliminar)",
  },
  pt: {
    personalizedPlan: "Seu plano personalizado",
    personalizedPlanFor: "Plano Personalizado para {0}",
    executiveSummary: "Resumo Executivo",
    difficultyCommitment: "Dificuldade e Compromisso",
    yourSituation: "Sua Situação",
    yourWhy: "Seu Porquê",
    firstWeekActions: "Ações da Primeira Semana",
    milestones: "Marcos",
    successCriteria: "Critérios de Sucesso",
    whatToAvoid: "O Que Evitar",
    blueprintResult: "Resultado do Plano",
    qaHistory: "Histórico Perguntas e Respostas",
    question: "Pergunta",
    answer: "Resposta",
    urgentImportant: "Urgente e Importante (Fazer)",
    importantNotUrgent: "Importante Não Urgente (Agendar)",
    urgentNotImportant: "Urgente Não Importante (Delegar)",
    neither: "Nenhum (Eliminar)",
  },
  fr: {
    personalizedPlan: "Votre plan personnalisé",
    personalizedPlanFor: "Plan personnalisé pour {0}",
    executiveSummary: "Résumé exécutif",
    difficultyCommitment: "Difficulté et engagement",
    yourSituation: "Votre situation",
    yourWhy: "Votre pourquoi",
    firstWeekActions: "Actions de la première semaine",
    milestones: "Jalons",
    successCriteria: "Critères de succès",
    whatToAvoid: "À éviter",
    blueprintResult: "Résultat du plan",
    qaHistory: "Historique Q&R",
    question: "Question",
    answer: "Réponse",
    urgentImportant: "Urgent et Important (Faire)",
    importantNotUrgent: "Important Non Urgent (Planifier)",
    urgentNotImportant: "Urgent Non Important (Déléguer)",
    neither: "Aucun (Éliminer)",
  },
  de: {
    personalizedPlan: "Ihr personalisierter Plan",
    personalizedPlanFor: "Personalisierter Plan für {0}",
    executiveSummary: "Zusammenfassung",
    difficultyCommitment: "Schwierigkeit und Engagement",
    yourSituation: "Ihre Situation",
    yourWhy: "Ihr Warum",
    firstWeekActions: "Aktionen der ersten Woche",
    milestones: "Meilensteine",
    successCriteria: "Erfolgskriterien",
    whatToAvoid: "Zu vermeiden",
    blueprintResult: "Planegebnis",
    qaHistory: "Fragen & Antworten",
    question: "Frage",
    answer: "Antwort",
    urgentImportant: "Dringend und wichtig (Tun)",
    importantNotUrgent: "Wichtig nicht dringend (Planen)",
    urgentNotImportant: "Dringend nicht wichtig (Delegieren)",
    neither: "Weder noch (Eliminieren)",
  },
};

function getLabel(lang: string | undefined, key: string, fallback: string, ...args: string[]): string {
  const labels = (lang && PDF_LABELS[lang]) || PDF_LABELS.en;
  let s = labels[key] ?? PDF_LABELS.en[key] ?? fallback;
  args.forEach((a, i) => { s = s.replace(`{${i}}`, a); });
  return s;
}

/** Framework ID → author image path (from public/images/authors). Every framework has an entry so the cover always tries to show an image. */
const FRAMEWORK_AUTHOR_IMAGES: Record<string, string> = {
  "first-principles": "/images/authors/elon musk 1.jpg",
  pareto: "/images/authors/Vilfredo_Pareto.jpg",
  rpm: "/images/authors/tony robbins.avif",
  eisenhower: "/images/authors/dwight-d-eisenhower.jpg",
  okr: "/images/authors/John Doerr.webp",
  dsss: "/images/authors/Tim-Ferriss.png",
  mandalas: "/images/authors/Tim-Ferriss.png",
  gps: "/images/authors/Tim-Ferriss.png",
  misogi: "/images/authors/Jesse Itzler.jpg",
  ikigai: "/images/authors/Mieko-Kamiya.jpg",
  general: "/images/authors/elon musk 1.jpg",
};
const FALLBACK_AUTHOR_IMAGE = "/images/authors/Tim-Ferriss.png";

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

export const generatePdf = async (
  blueprint: Blueprint,
  branding?: PdfBranding,
  options?: PdfOptions
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const lang = options?.language || "en";
  const userName = options?.userName?.trim();
  const messages = options?.messages;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  const footerReserve = 22;
  const contentBottom = pageHeight - margin - footerReserve;
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

  let currentPage = 1;
  // Helper to add new page with background
  const addNewPage = () => {
      doc.addPage();
      currentPage++;
      fillBackground();
      y = margin;
  };

  const result = blueprint.result as any;
  // Use full first answer for cover title (blueprint.title is truncated to 60 chars for UI)
  const fullTitleFromAnswer = (blueprint.answers?.[0] ?? "").trim();
  const displayTitle = (fullTitleFromAnswer || blueprint.title || result?.shortTitle || "").trim() || "Your Plan";
  const frameworkLabel = String(blueprint.framework || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // --- COVER PAGE ---
  fillBackground();
  const centerX = pageWidth / 2;
  let coverY = pageHeight * 0.25;
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  setPrimary();
  const coverTitleLines = doc.splitTextToSize(displayTitle, contentWidth);
  coverTitleLines.forEach((line: string) => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, centerX - lineWidth / 2, coverY);
    coverY += 12;
  });
  coverY += 20;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  setMuted();
  if (frameworkLabel) doc.text(frameworkLabel, centerX - doc.getTextWidth(frameworkLabel) / 2, coverY);
  coverY += 10;
  const fwId = String(blueprint.framework || "").toLowerCase();
  const authorImgPath = FRAMEWORK_AUTHOR_IMAGES[fwId] || FALLBACK_AUTHOR_IMAGE;
  let imageLoaded = false;
  const imgW = 40;
  const imgH = 40;
  const imgCenterY = coverY + imgH / 2;
  const drawCircularAuthorImage = (dataUrl: string) => {
    doc.saveGraphicsState();
    doc.circle(centerX, imgCenterY, imgH / 2, null);
    doc.clip();
    doc.discardPath?.();
    doc.addImage(dataUrl, "PNG", centerX - imgW / 2, coverY, imgW, imgH);
    doc.restoreGraphicsState();
  };
  try {
    const dataUrl = await loadImage(authorImgPath);
    drawCircularAuthorImage(dataUrl);
    coverY += imgH + 12;
    imageLoaded = true;
  } catch {
    try {
      const fallbackUrl = await loadImage(FALLBACK_AUTHOR_IMAGE);
      drawCircularAuthorImage(fallbackUrl);
      coverY += imgH + 12;
      imageLoaded = true;
    } catch {
      coverY += 10;
    }
  }
  if (!imageLoaded) coverY += 10;
  doc.text(new Date(blueprint.createdAt).toLocaleDateString(), centerX - doc.getTextWidth(new Date(blueprint.createdAt).toLocaleDateString()) / 2, coverY);
  coverY += 24;
  doc.setFontSize(10);
  setMuted();
  const personalizedText = userName
    ? getLabel(lang, "personalizedPlanFor", "Personalized plan for {0}", userName)
    : getLabel(lang, "personalizedPlan", "Your personalized plan");
  doc.text(personalizedText, centerX - doc.getTextWidth(personalizedText) / 2, coverY);

  addNewPage();

  // TOC page (page 2) — will be filled at end
  const tocPageNum = currentPage;
  addNewPage();
  setBody();

  // Helper: ensure space for at least minLines, add new page if needed (content must stay above footer)
  const ensureSpace = (minLines = 5) => {
    if (y > contentBottom - minLines * 7) addNewPage();
  };

  // Helper: write a multi-line text block with automatic pagination (respects contentBottom)
  const writeMultilineText = (lines: string[], x: number, lineHeight = 5) => {
    lines.forEach((line) => {
      if (y > contentBottom - lineHeight - 2) addNewPage();
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  // TOC: collect section names and page numbers for final render
  const tocEntries: { name: string; page: number }[] = [];
  const recordToc = (name: string) => {
    tocEntries.push({ name, page: currentPage });
  };

  // Helper: render a section (heading + content). Ensure space first so TOC records the correct start page after any new page.
  const renderSection = (heading: string, content: string | string[], options?: { indent?: boolean }) => {
    ensureSpace(12);
    recordToc(heading);
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
      // ensure enough space for this entire block; if not, start on a fresh page
      if (y > contentBottom - (lines.length + 1) * 5) {
        addNewPage();
      }
      writeMultilineText(lines as string[], margin + indent);
      y += 2;
    });
    y += 6;
  };

  // --- EXECUTIVE SUMMARY ---
  if (result?.executiveSummary) {
    renderSection(getLabel(lang, "executiveSummary", "Executive Summary"), result.executiveSummary);
  }

  // --- DIFFICULTY & COMMITMENT ---
  if (result?.difficulty || result?.difficultyReason || result?.commitment) {
    ensureSpace(10);
    recordToc(getLabel(lang, "difficultyCommitment", "Difficulty & Commitment"));
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text(getLabel(lang, "difficultyCommitment", "Difficulty & Commitment"), margin, y);
    setBody();
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const parts: string[] = [];
    if (result.difficulty) parts.push(`Level: ${String(result.difficulty).replace(/\b\w/g, c => c.toUpperCase())}`);
    if (result.commitment) parts.push(`Estimated: ${result.commitment}`);
    if (parts.length > 0) {
      const partLines = doc.splitTextToSize(parts.join(" · "), contentWidth);
      if (y > contentBottom - (partLines.length + 1) * 5) addNewPage();
      writeMultilineText(partLines as string[], margin, 5);
      y += 6;
    }
    if (result.difficultyReason) {
      const drLines = doc.splitTextToSize(result.difficultyReason, contentWidth);
      if (y > contentBottom - (drLines.length + 1) * 5) addNewPage();
      writeMultilineText(drLines as string[], margin, 5);
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
    renderSection(getLabel(lang, "yourSituation", "Your Situation"), situationParts);
  }

  // --- YOUR WHY ---
  const yourWhy = result?.yourWhy || (result?.type === "rpm" && result?.purpose ? result.purpose : null);
  if (yourWhy) {
    renderSection(getLabel(lang, "yourWhy", "Your Why"), yourWhy);
  }

  // --- FIRST WEEK ACTIONS ---
  const firstWeek = result?.firstWeekActions;
  if (Array.isArray(firstWeek) && firstWeek.length > 0) {
    renderSection(getLabel(lang, "firstWeekActions", "First Week Actions"), firstWeek.map((a: string, i: number) => `${i + 1}. ${a}`));
  }

  // --- MILESTONES / CHECKPOINTS ---
  const milestones = result?.milestones;
  if (Array.isArray(milestones) && milestones.length > 0) {
    renderSection(getLabel(lang, "milestones", "Milestones"), milestones.map((m: string) => `• ${m}`));
  }

  // --- SUCCESS CRITERIA ---
  const successCriteria = result?.successCriteria;
  const successMatch = !successCriteria && firstAnswer ? firstAnswer.match(/(?:Success looks like|Éxito)\s*:?\s*([^.]+)/i) : null;
  const successText = successCriteria || (successMatch?.[1]?.trim() ? `You'll know you've succeeded when: ${successMatch[1].trim()}` : null);
  if (successText) {
    renderSection(getLabel(lang, "successCriteria", "Success Criteria"), successText);
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
    renderSection(getLabel(lang, "whatToAvoid", "What to Avoid"), avoidItems.map(a => `• ${a}`));
  }

  // Divider before Blueprint Result
  setDrawBorder();
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  setBody();

  // Result Section
  if (blueprint.result) {
    ensureSpace(12);
    recordToc(getLabel(lang, "blueprintResult", "Blueprint Result"));
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text(getLabel(lang, "blueprintResult", "Blueprint Result"), margin, y);
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
           if (y > contentBottom - (lines.length + 1) * 7) {
             addNewPage();
           }
           writeMultilineText(lines as string[], margin, 7);
       });
       y += 5;
       doc.setFont("helvetica", "bold");
       setPrimary();
       doc.text("New Approach:", margin, y);
       setBody();
       y += 8;
       doc.setFont("helvetica", "normal");
       const lines = doc.splitTextToSize(result.newApproach || "", contentWidth);
       if (y > contentBottom - (lines.length + 1) * 7) {
         addNewPage();
       }
       writeMultilineText(lines as string[], margin, 7);
       y += 12;
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
             if (y > contentBottom - (lines.length + 1) * 6) {
               addNewPage();
             }
             writeMultilineText(lines as string[], margin + 5, 6);
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
             if (y > contentBottom - (lines.length + 1) * 6) {
               addNewPage();
             }
             writeMultilineText(lines as string[], margin + 5, 6);
        });
    }
    else if (result.type === 'rpm') {
        doc.setFont("helvetica", "bold");
        setPrimary();
        const resultLines = doc.splitTextToSize(`Result: ${result.result || ""}`, contentWidth);
        if (y > contentBottom - (resultLines.length + 1) * 6) {
          addNewPage();
        }
        writeMultilineText(resultLines as string[], margin, 6);
        setBody();
        y += 10;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Purpose:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "italic");
        const pLines = doc.splitTextToSize(result.purpose || "", contentWidth);
        if (y > contentBottom - (pLines.length + 1) * 7) {
          addNewPage();
        }
        writeMultilineText(pLines as string[], margin + 5, 7);
        y += 5;
        
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Massive Action Plan:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.plan || []).forEach((item: string, i: number) => {
            const lines = doc.splitTextToSize(`${i+1}. ${item}`, contentWidth - 10);
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
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
                    if (y > contentBottom - (itemLines.length + 1) * 6) {
                      addNewPage();
                    }
                    writeMultilineText(itemLines as string[], margin + 5, 6);
                });
            }
            y += 6;
        };
        renderQuadrant(getLabel(lang, "urgentImportant", "Urgent & Important (Do)"), result.q1 || []);
        renderQuadrant(getLabel(lang, "importantNotUrgent", "Important Not Urgent (Schedule)"), result.q2 || []);
        renderQuadrant(getLabel(lang, "urgentNotImportant", "Urgent Not Important (Delegate)"), result.q3 || []);
        renderQuadrant(getLabel(lang, "neither", "Neither (Eliminate)"), result.q4 || []);
    }
    else if (result.type === 'okr') {
        doc.setFont("helvetica", "bold");
        setPrimary();
        const objLines = doc.splitTextToSize(`Objective: ${result.objective || ""}`, contentWidth);
        if (y > contentBottom - (objLines.length + 1) * 6) {
          addNewPage();
        }
        writeMultilineText(objLines as string[], margin, 6);
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
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
        });
        y += 5;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text(`Initiative: ${result.initiative}`, margin, y);
        setBody();
        y += 10;
    }
    else if (result.type === "gps") {
        // GPS: Goal, Plan, System, Anti-Goals
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Goal:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        const goalLines = doc.splitTextToSize(result.goal || "", contentWidth);
        if (y > contentBottom - (goalLines.length + 1) * 6) {
          addNewPage();
        }
        writeMultilineText(goalLines as string[], margin + 5, 6);
        y += 8;

        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Plan (Major Moves):", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.plan || []).forEach((item: string, i: number) => {
            const lines = doc.splitTextToSize(`${i + 1}. ${item}`, contentWidth);
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
        });
        y += 6;

        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("System (Habits & Environment):", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        (result.system || []).forEach((item: string, i: number) => {
            const lines = doc.splitTextToSize(`${i + 1}. ${item}`, contentWidth);
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
        });
        y += 6;

        if (Array.isArray(result.anti_goals) && result.anti_goals.length > 0) {
            doc.setFont("helvetica", "bold");
            setPrimary();
            doc.text("Anti-Goals (What We'll Avoid):", margin, y);
            setBody();
            y += 8;
            doc.setFont("helvetica", "normal");
            result.anti_goals.forEach((item: string) => {
                const lines = doc.splitTextToSize(`• ${item}`, contentWidth);
                if (y > contentBottom - (lines.length + 1) * 6) {
                  addNewPage();
                }
                writeMultilineText(lines as string[], margin + 5, 6);
            });
            y += 6;
        }
        y += 6;
    }
    else if (result.type === 'dsss') {
        const dsss = result as { objective?: string; deconstruct?: string[]; selection?: string[]; sequence?: string[]; stakes?: string };
        if (dsss.objective) {
            doc.setFont("helvetica", "bold");
            setPrimary();
            const objLines = doc.splitTextToSize(`Objective: ${dsss.objective}`, contentWidth);
            if (y > contentBottom - (objLines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(objLines as string[], margin, 6);
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
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
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
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
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
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
        });
        y += 6;
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Stakes:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        const stakesLines = doc.splitTextToSize(dsss.stakes || "", contentWidth);
        if (y > contentBottom - (stakesLines.length + 1) * 6) {
          addNewPage();
        }
        writeMultilineText(stakesLines as string[], margin + 5, 6);
        y += 12;
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
            if (y > contentBottom - (lines.length + 1) * 6) {
              addNewPage();
            }
            writeMultilineText(lines as string[], margin + 5, 6);
            y += 8;
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
                if (y > contentBottom - (textLines.length + 1) * 6) {
                  addNewPage();
                }
                writeMultilineText(textLines as string[], margin + 5, 6);
                y += 6;
            }
        }
        y += 6;
    }
    else if (result.type === 'mandalas' || (blueprint.framework === 'mandalas' && (result.centralGoal || result.central_goal || (result.categories && result.categories.length > 0)))) {
        const mandala = result as { centralGoal?: string; central_goal?: string; categories?: Array<{ name: string; steps?: string[]; why?: string }> };
        const centralGoalText = (mandala.centralGoal || mandala.central_goal || blueprint.title || "").trim();
        doc.setFont("helvetica", "bold");
        setPrimary();
        doc.text("Central Goal:", margin, y);
        setBody();
        y += 8;
        doc.setFont("helvetica", "normal");
        if (centralGoalText) {
          const goalLines = doc.splitTextToSize(centralGoalText, contentWidth);
          if (y > contentBottom - (goalLines.length + 1) * 6) addNewPage();
          writeMultilineText(goalLines as string[], margin + 5, 6);
          y += 10;
        }
        const categories = mandala.categories || [];
        if (categories.length > 0) {
          doc.setFont("helvetica", "bold");
          setPrimary();
          doc.text("Your Mandala (Categories & Steps):", margin, y);
          setBody();
          y += 8;
          doc.setFont("helvetica", "normal");
        }
        categories.forEach((cat: { name?: string; steps?: string[]; why?: string }, i: number) => {
            ensureSpace(10);
            doc.setFont("helvetica", "bold");
            setPrimary();
            doc.text(`${i + 1}. ${cat.name || "Category"}`, margin, y);
            setBody();
            y += 8;
            doc.setFont("helvetica", "normal");
            (cat.steps || []).filter(Boolean).forEach((step: string) => {
                const stepLines = doc.splitTextToSize(`  • ${step}`, contentWidth - 15);
                if (y > contentBottom - (stepLines.length + 1) * 6) addNewPage();
                writeMultilineText(stepLines as string[], margin + 5, 6);
            });
            if (cat.why && String(cat.why).trim()) {
              const whyLines = doc.splitTextToSize(`  Why: ${cat.why}`, contentWidth - 15);
              if (y > contentBottom - (whyLines.length + 1) * 6) addNewPage();
              writeMultilineText(whyLines as string[], margin + 5, 6);
            }
            y += 6;
        });
        y += 6;
    }
  }

  y += 14;

  if (y > contentBottom - 30) addNewPage();

  // Divider before Q&A
  setDrawBorder();
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Q&A Section — Vector theme (only real user answers; exclude system-injected userReview feedback)
  const USER_REVIEW_PREFIX = "User-perspective review requested improvements";
  const isFakeAnswer = (text: string) =>
    (text || "").trim().startsWith(USER_REVIEW_PREFIX);

  // Build Q&A pairs from messages when available; otherwise use filtered answers only
  type QAPair = { question?: string; answer: string };
  let qaPairs: QAPair[] = [];
  const stripMarkdown = (s: string) =>
    (s || "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^#+\s*/gm, "").trim();

  if (Array.isArray(messages) && messages.length > 0) {
    let lastAi = "";
    for (const m of messages) {
      if (m.role === "ai" && m.content) {
        lastAi = stripMarkdown(
          m.content.replace(/\|\|\[.*?\]\s*$/s, "").replace(/\|\|DRAFT_START[\s\S]*\|\|DRAFT_END\|\|/g, "").trim()
        );
      }
      if (m.role === "user" && !isFakeAnswer(m.content)) {
        qaPairs.push({
          question: lastAi.length > 20 ? lastAi : undefined,
          answer: stripMarkdown(m.content),
        });
      }
    }
  } else {
    const realAnswers = (blueprint.answers || []).filter((a) => !isFakeAnswer(a));
    qaPairs = realAnswers.map((answer) => ({ answer }));
  }

  ensureSpace(10);
  recordToc(getLabel(lang, "qaHistory", "Q&A History"));
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  setPrimary();
  doc.text(getLabel(lang, "qaHistory", "Q&A History"), margin, y);
  setBody();
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const formatAnswer = (text: string): string[] => {
    const trimmed = (text || "").trim();
    if (!trimmed) return [];
    const byLines = trimmed.split(/\n+/).map((s) => s.replace(/^[\s•\-]+\s*/, "").trim()).filter(Boolean);
    if (byLines.length > 1) return byLines;
    const bySentence = trimmed.split(/\.\s+/).map((s) => s.trim()).filter((s) => s.length > 2);
    if (bySentence.length > 1) return bySentence.map((s) => (s.endsWith(".") ? s : s + "."));
    return [trimmed];
  };

  const qLabel = getLabel(lang, "question", "Question");
  const aLabel = getLabel(lang, "answer", "Answer");
  qaPairs.forEach((pair, i) => {
    if (pair.question) {
      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      setPrimary();
      doc.text(`${qLabel} ${i + 1}:`, margin, y);
      setBody();
      y += 7;
      doc.setFont("helvetica", "normal");
      const qLines = doc.splitTextToSize(pair.question, contentWidth - 5);
      if (y > contentBottom - qLines.length * 5) addNewPage();
      writeMultilineText(qLines as string[], margin + 5, 5);
      y += 6;
    }
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    setPrimary();
    doc.text(`${aLabel} ${i + 1}:`, margin, y);
    setBody();
    y += 7;
    doc.setFont("helvetica", "normal");
    const segments = formatAnswer(pair.answer);
    if (segments.length > 1) {
      segments.forEach((seg) => {
        const lines = doc.splitTextToSize(`• ${seg}`, contentWidth - 10);
        if (y > contentBottom - (lines.length + 1) * 5) addNewPage();
        writeMultilineText(lines as string[], margin + 5, 5);
      });
    } else {
      const lines = doc.splitTextToSize(pair.answer, contentWidth);
      if (y > contentBottom - (lines.length + 1) * 5) addNewPage();
      writeMultilineText(lines as string[], margin, 5);
    }
    y += 10;
  });

  // Fill TOC page (clickable links when textWithLink is available)
  if (tocEntries.length > 0) {
    doc.setPage(tocPageNum);
    fillBackground();
    setPrimary();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", margin, margin + 10);
    setBody();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let tocY = margin + 28;
    const textWithLink = (doc as any).textWithLink;
    for (const entry of tocEntries) {
      if (tocY > pageHeight - margin - 20) break;
      const pageStr = String(entry.page);
      if (typeof textWithLink === "function") {
        try {
          textWithLink.call(doc, entry.name, margin, tocY, { pageNumber: entry.page });
          setMuted();
          doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), tocY);
          setBody();
        } catch {
          doc.text(`${entry.name} ............. ${pageStr}`, margin, tocY);
        }
      } else {
        doc.text(`${entry.name} ............. ${pageStr}`, margin, tocY);
      }
      tocY += 10;
    }
  }

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

/** Sanitize and truncate filename; add date prefix. */
function sanitizePdfFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
  return safe ? `vector-${date}-${safe}.pdf` : `vector-${date}-blueprint.pdf`;
}

export const exportToPdf = async (blueprint: Blueprint, branding?: PdfBranding, options?: PdfOptions) => {
    const doc = await generatePdf(blueprint, branding, options);
    doc.save(sanitizePdfFilename(blueprint.title));
};
