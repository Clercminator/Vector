/**
 * Compute Personal Info section completion percentage.
 * Used by Profile page and HelpMeChooseModal to show progress and reminders.
 */
export interface ProfileMetadata {
  bio?: string;
  metadata?: {
    interests?: string;
    skills?: string;
    hobbies?: string;
    preferred_plan_style?: string;
    stay_on_track?: string;
    other_observations?: string;
    question_flow?: string;
    preferred_tone?: string;
    treatment_level?: string;
    age?: string | number;
    gender?: string;
    country?: string;
  };
}

export function computePersonalInfoCompletion(profile: ProfileMetadata | null): {
  filled: number;
  total: number;
  percent: number;
  isLow: boolean;
} {
  if (!profile) {
    return { filled: 0, total: 13, percent: 0, isLow: true };
  }
  const m = profile.metadata || {};
  const fields = [
    (profile.bio || '').trim().length > 0,
    (m.interests || '').trim().length > 0,
    (m.skills || '').trim().length > 0,
    (m.hobbies || '').trim().length > 0,
    (m.preferred_plan_style || '').length > 0,
    (m.stay_on_track || '').trim().length > 0,
    (m.other_observations || '').trim().length > 0,
    (m.question_flow || '').length > 0,
    (m.preferred_tone || '').length > 0,
    (m.treatment_level || '').length > 0,
    (m.age ?? '').toString().trim().length > 0,
    (m.gender || '').length > 0,
    (m.country || '').length > 0,
  ];
  const filled = fields.filter(Boolean).length;
  const total = fields.length;
  const percent = Math.round((filled / total) * 100);
  return { filled, total, percent, isLow: percent < 70 };
}
