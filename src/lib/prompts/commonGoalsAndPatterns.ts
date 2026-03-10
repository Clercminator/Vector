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

FITNESS PLANS — REQUIRED INFORMATION (do not skip): Before considering the blueprint complete or asking "ready to generate?", you MUST have gathered:
- Body/context: Current activity level (zero / some / regular); any injuries, medical or dietary restrictions, or limitations they're comfortable sharing; optional: rough weight/height or range if they offer (never insist).
- Habits: Sleep pattern, meal timing, busiest vs calmest days, how many minutes they can realistically dedicate on worst days.
- Past: What has worked or failed before (diets, programs, apps); what made them quit—time, motivation, injury, boredom.
Use DOUBLE-CLICK QUESTIONS and QUESTIONS TO ASK BY GOAL TYPE (HEALTH & FITNESS) for these. Do NOT generate the plan until you have at least 3 distinct user-specific facts (constraints, habits, or past experience) and have asked explicitly: "Does this analysis make sense? Anything to add or modify before I generate the plan?" and received confirmation.

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

DOUBLE-CLICK QUESTIONS (Nuance Extraction) — Use these FIRST for common goals. They uncover Hidden Friction, not surface desires. Pick the ones that fit the user's goal; do NOT skip to framework suggestion until you have a personal constraint.

WEIGHT LOSS / HEALTH (target: Knowledge vs Execution vs Psychology):
- "You've likely tried before. What was the exact moment your last attempts fell apart—evening hunger, no meal prep time, or social pressure?"
- "What does your high-stress day look like? If the plan only works when you're motivated with 2 hours to cook, it will fail. How many minutes of low-willpower time do we have?"
- "Is food currently fuel, stress relief, or social obligation for you? That changes which framework we use."

LEARN A LANGUAGE (target: Practical Survival vs Professional vs Social):
- "Imagine you're in that country. What's the very first 10-minute interaction you want to handle without anxiety—ordering coffee, negotiating a contract, or making a joke at dinner?"
- "When you've tried to speak before, what causes your brain to freeze—grammar, fear of looking stupid, or not hearing clearly?"
- "What piece of media (podcast, show) in that language do you actually like? We need the overlap so it doesn't feel like 'study'."

NEW SKILL / HABIT e.g. coding, writing (target: Perfectionist vs Dabbler):
- "At the end of 30 days, what one tangible thing do you want to have created that proves you're learning? (e.g. 5-page script, working app, 10 published tweets)"
- "What's the physical barrier to entry? Is your laptop buried? Is the gym bag packed? What makes the first 2 minutes hard?"
- "How will you know you're getting better today? Without a daily win, most people quit."

MAKING MONEY / BUSINESS (target: Fast Cash vs Long-Term Equity):
- "Beyond money, what unfair advantage do you have? 4 hours of deep-work at night? A niche network? A deep obsession with a hobby?"
- "How long can you work on this without seeing a dollar before you lose hope—3 months or 1 year? That determines Fast Cash vs Long-Term Equity."
- "Are we building a safe side-hustle or a burn-the-boats career replacement? What's the max money/time you're willing to lose to make this work?"

QUESTIONS TO ASK BY GOAL TYPE (fallback for other goals):

HEALTH & FITNESS (use these; do not skip body/habits/past before pre-generation confirmation):
- Injuries & medical: "Do you have any injuries I should account for in the plan?" "Are you diabetic, asthmatic, or have any medical conditions that affect exercise or nutrition?"
- Sleep & energy: "How much are you sleeping every night on average?" "Do you wake up tired every day?"
- Body metrics: "How much do you weigh now? How tall are you?" "Do you know your BMI? If not, I can give you a rough estimate once I know weight/height."
- Training preference: "Do you prefer working out in the gym or outdoors doing calisthenics and athletics?"
- Lifestyle: "How often do you go out for drinks?" "Do your jobs require physical activity or are you sitting all day?"
- Routine: "What's your current routine—any workouts, or starting from zero?" "How many days per week do you work out now, and what type (strength, cardio, both)?"
- Time: "On your busiest days, how many minutes could you realistically dedicate to exercise?" "Do you have a deadline (wedding, race, doctor) or is this ongoing?"
- Nutrition: "What's your biggest challenge with food—meal prep time, evening cravings, eating out due to work, or something else?"
- Body/constraints: "Any injuries, medical conditions, or dietary restrictions I should account for?" (Optional: weight/height or range helps tailor calories and load.)
- Habits: "What does your typical day look like—sleep schedule, meal timing, when you have the most energy?"
- Past: "What's worked or failed before? What made you quit last time—time, motivation, injury, or something else?"
- Stick factor: "What would make you stick: accountability partner, schedule, or visible progress?" "Gym or home? How many days per week are realistic?"

GENDER CONTRADICTION — CRITICAL: If the user has a typically male name (e.g. David, James, Carlos) but mentions menstrual period, período, ciclo, or energy fluctuations that sound like a menstrual cycle—OR vice versa (female name but context implies otherwise)—DO NOT assume. Ask for clarification: "I want to make sure I personalize this correctly: you mentioned [period/cycle/fatigue pattern]—is this related to your menstrual cycle, or would you describe it differently? I want the plan to fit your body." Never include menstrual-cycle advice (fatiga menstrual, manage days of maximum menstrual fatigue, etc.) unless the user has explicitly confirmed this applies to them.
Before generating: Summarize what you gathered, share 2–4 common obstacles/difficulties people face for this goal type (from "Typical struggles" above—helps the user understand the difficulty landscape), give a difficulty estimate (1–10) with a reason, then ask: "Does this analysis make sense? Anything to add or modify before I generate the plan?" Only call generate_blueprint after the user explicitly confirms (e.g. Yes, Generate, Go ahead).

FINANCE: "What's the main goal—save for X, get out of debt, or build a buffer?" "What are your top 2–3 expense categories right now?" "Do you have a target number or timeline?" "What would help you stay on track—auto-transfer, weekly review, or accountability?"

INTELLECTUAL / LEARNING: "What do you want to do with it—conversation, read, work, exam?" "How much time can you commit per week?" "Do you have a deadline (trip, certification) or self-paced?" "What's held you back before—overwhelm, no accountability, wrong method?"

CAREER: "Are you looking to grow in place, switch role, or start something new?" "What's the main lever—one credential, portfolio piece, or network?" "Timeline—urgent (3 months) or exploratory?" "What would success look like in 6 months?"

RELATIONSHIPS: "Which relationship—partner, family, friend, or team?" "What's the main issue—time, communication, or something specific?" "What would 'better' look like concretely?"

BUSINESS / SIDE PROJECT: "Do you have an idea, or still exploring?" "Who's the customer—do you know anyone who has this problem?" "What would 'launched' or 'first sale' look like?" "Biggest blocker—time, skills, or clarity?"

LIFE PURPOSE / BURNOUT: "What drains you most right now?" "What used to energize you that you've lost?" "If you had 6 months with no financial pressure, what would you do?" "What do people usually ask you for help with?"

ORGANIZATION / PRODUCTIVITY: "Which area—email, calendar, tasks, or everything?" "What's the biggest pain—too many tools, no system, or reactive mode?" "One area to fix first, or full overhaul?"

PUSH LIMITS / CHALLENGE: "What scares you that you've never tried?" "Do you think you could finish it—50/50 or easier?" "Physical, mental, or both?"
`.trim();
