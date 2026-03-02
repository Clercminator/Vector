/**
 * Most common goals and problems people want to achieve/solve.
 * Use this so the agent can give well-thought, experience-based answers instead of generic LLM responses.
 * Injected into consultant (to recommend) and ask (to guide with patterns).
 */

export const commonGoalsAndPatterns = `
COMMON GOALS AND PATTERNS — Use this knowledge to deliver expert, experience-based guidance. These are the goals people bring most often; know their typical struggles and what works.

RULE: Plans must be beginner-level and trackable. Include frequency (how often), intensity/duration (how long, how hard), deadlines or mini goals. Never output vague items like "Exercise" or "Eat better"—spell out: "Strength training 3x/week, 45 min" or "Meal prep Sundays, 5 portions".

— Learn a language —
One of the most common goals. Typical struggles: Overwhelm (too many apps and methods), grammar-first paralysis (never speaking), no accountability (quit after a few weeks), treating it like school instead of acquisition. What works: Focus on high-frequency vocabulary first (e.g. 1,200–2,000 words = 80% of speech); comprehensible input + speaking from day one; a clear deadline or stake (test, trip, partner). Best frameworks: DSSS (Tim Ferriss's famous use—he learns languages extremely fast with Deconstruct, Select 20%, Sequence, Stakes), Pareto (vital few words and habits), RPM (Result = conversation by date, Purpose = travel/family, Map = daily input + weekly speaking). Misogi fits for immersion (one-way ticket, survive with no English).

— Get fit / lose weight —
Very common. Typical struggles: Doing too much at once, isolation exercises and "junk miles," no emotional why (quit when motivation fades), confusion about nutrition. What works: Compound movements and one cardio modality beat scattered workouts; sleep and consistency beat perfect programs; a compelling Purpose (e.g. play with kids, wedding) sustains action. Best frameworks: Pareto (vital few: compound lifts, HIIT, sleep; cut the rest), RPM (Result + Purpose + Map), OKR (measurable: body fat %, 5K time, sessions/week), GPS (one Goal + System: clothes laid out, calendar block). Eisenhower: Q2 = schedule workouts; Q4 = scrolling instead of moving.

— Start a business —
Common among side-hustlers and career changers. Typical struggles: Building before validating, perfectionism (logo, site), no clear offer or channel, treating all customers equally. What works: Customer discovery first; one offer, one channel, first 10 customers; "fire" the bottom 20% of clients (Pareto); Result + Purpose + Map (RPM); measurable milestones (OKR: interviews, NPS, MRR). Best frameworks: Pareto (whales vs minnows), RPM (business outcomes + emotional why), OKR (product-market fit, NPS, MRR), First Principles (value = problem solved; sell outcome first). GPS for execution (1 Goal, 3 Priorities, 5 Strategies).

— Switch career —
Typical struggles: Applying everywhere with a generic résumé, no clear target, no leverage (one credential or portfolio piece that unlocks roles). What works: One credential or one portfolio piece that opens 80% of doors; informational interviews; measurable plan (OKR: 50 interviews, 3 final rounds); stakes (apply to 20 by date or donate $X). Best frameworks: Pareto (one skill/credential that unlocks most roles), DSSS (deconstruct role, select 20%, sequence, stakes), OKR (credential, interviews, offers), RPM (Result = offer by date, Purpose = alignment/security).

— Read more —
Typical struggles: Guilt, finishing every book, no time block, treating all books equally. What works: One genre or 20-min block; extract the one idea per book (Pareto/First Principles); Goal + System (book on pillow, no phone in bed—GPS); Result + Purpose (RPM). Best frameworks: Pareto (vital few: key ideas, one slot; trivial: linear reading, guilt), First Principles (books are idea containers), GPS (Goal + System), RPM (Result = 12 books, Purpose = example for kids).

— Save money / get out of debt —
Typical struggles: Nickel-and-diming small expenses while big leaks continue; no auto-transfer; no "why." What works: Find the 2–3 expense categories that dominate (Pareto); auto-transfer to savings before spending; clear Purpose (security, quit option); Q2 = weekly review, Q4 = impulse browsing (Eisenhower). Best frameworks: Pareto (vital few expenses), RPM (Result = emergency fund by date, Purpose = peace of mind), Eisenhower (Q2 = system, Q4 = cut), OKR (6 months expenses, zero credit card, 20% saved).

— Get organized —
Typical struggles: Organizing everything at once, no single system, urgent requests crowd out the important. What works: One area first (inbox, calendar) or one rule (one-touch); block Q2 time for the system; drop the rest (Q4). Best frameworks: Pareto (one area or one rule), Eisenhower (Q2 = one system, Q4 = everything else), GPS (Goal = inbox zero + calendar truth, System = reminder).

— Improve a relationship —
Typical struggles: Reacting to the other person, no scheduled quality time, confusing urgent messages with important connection. What works: Q2 = scheduled quality time and hard conversations; Purpose (RPM) for why the relationship matters; reduce Q3 (reactive messaging). Best frameworks: RPM (Result = better connection, Purpose = love/family, Map = weekly date, one hard conversation), Eisenhower (Q2 = relationship blocks, Q3 = delegate/delay reactive stuff).

— Travel to [place] —
Typical struggles: Trying to see everything, exhausting itineraries, no clear "why" for the trip. What works: 2–3 experiences that define the trip (Pareto); Result + Purpose (e.g. psychological reset, reconnect with spouse—RPM); book flight + key days, leave rest open (First Principles). Best frameworks: Pareto (vital few experiences), RPM (Result = reset in nature, Purpose = disconnect/reconnect, Map = cabin, OOO, gear).

— Buy a house / car —
Typical struggles: Endless browsing, no criteria, no timeline. What works: Define non-negotiables (location, budget, 2–3 must-haves); get pre-approved; Result + Purpose (keys by date, stability for family); consider first-principles options (seller financing, house hack). Best frameworks: Pareto (vital few criteria), RPM (Result = keys by date, Purpose = family), First Principles (negotiable terms), GPS (Goal + 3 Priorities: finances, research, team).

— Build a habit —
Typical struggles: Relying on discipline, no trigger or environment design. What works: Attach to existing habit; design environment (cue visible); Goal + System (GPS); tiny start; stakes or accountability. Best frameworks: GPS (Goal + System, Anti-Goals), First Principles (habit = cue-routine-reward + context), RPM (Purpose fuels the Map).

— Push my limits / one defining challenge —
Typical struggles: Picking something too easy or too vague. What works: 50% chance of success (Misogi rule); safe but scary; unique to you; commit publicly or financially. Best frameworks: Misogi (year-defining challenge, 50/50, Don't Die), optionally RPM (Result = finish challenge, Purpose = expansion).

— Balance life and work / reduce stress —
Typical struggles: Treating balance as "when I have time"; no clear categories. What works: Name the life areas (Mandala: 8 categories); schedule Q2 for health, relationships, learning; Pareto on time (what 20% of activities restore you?). Best frameworks: Mandala Chart (central goal "Integrated life," 8 areas × 8 steps), Eisenhower (Q2 = balance activities, not "leftover" time), RPM (Result = integrated life, Purpose = sustainability).
`.trim();
