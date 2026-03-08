export const COUNTRIES = [
  'united_states',
  'united_kingdom',
  'canada',
  'australia',
  'germany',
  'france',
  'spain',
  'italy',
  'brazil',
  'mexico',
  'argentina',
  'bolivia',
  'chile',
  'colombia',
  'costa_rica',
  'cuba',
  'dominican_republic',
  'ecuador',
  'el_salvador',
  'guatemala',
  'honduras',
  'nicaragua',
  'panama',
  'paraguay',
  'peru',
  'puerto_rico',
  'uruguay',
  'venezuela',
  'india',
  'china',
  'japan',
  'other'
] as const;

export const GENDERS = [
  'male',
  'female',
  'other'
] as const;

export const ZODIACS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces'
] as const;

/** How much the user relies on zodiac for personality description. */
export const ZODIAC_IMPORTANCE = ['super', 'somewhat', 'nothing'] as const;

/** Preferred plan style for agent personalization. */
export const PLAN_STYLES = ['action_focused', 'reflective', 'balanced'] as const;

/** How the user prefers Vector to ask questions: list (all at once) or one_at_a_time (with suggestions). */
export const QUESTION_FLOW = ['list', 'one_at_a_time'] as const;

/** Tone the user prefers from Vector. */
export const PREFERRED_TONES = ['friendly', 'professional', 'direct', 'encouraging'] as const;

/** How the user wants to be treated by Vector (expertise level). */
export const TREATMENT_LEVELS = ['expert', 'beginner', 'mixed'] as const;
