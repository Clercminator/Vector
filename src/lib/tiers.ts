/**
 * Tier configuration: credits, allowed frameworks, and feature flags.
 * All tiers get all frameworks; free tier gets 1 full-experience plan (export, etc.).
 * IDs: architect (free, 1 plan), standard/builder (5 plans, $5.99), max (20 plans, $12.99), enterprise (contact).
 */

export type FrameworkId = 'first-principles' | 'pareto' | 'rpm' | 'eisenhower' | 'okr' | 'dsss' | 'mandalas' | 'gps' | 'misogi' | 'ikigai' | 'general';

export const ALL_FRAMEWORKS: FrameworkId[] = [
  'first-principles',
  'pareto',
  'rpm',
  'eisenhower',
  'okr',
  'dsss',
  'mandalas',
  'gps',
  'misogi',
  'ikigai',
  'general',
];

export type TierId = 'architect' | 'standard' | 'max' | 'enterprise';

export interface TierConfig {
  id: TierId;
  /** Number of plans: create + save. Free = 1, Builder = 5, Max = 20, Enterprise = unlimited. */
  credits: number;
  /** Same as credits: one plan = one creation + one saved slot. Kept for display only. */
  maxBlueprints: number;
  /** All tiers can use all frameworks (no gating). */
  allowedFrameworks: FrameworkId[];
  canExportCalendar: boolean;
  canExportPdf: boolean;
  priorityAi: boolean;
  /** One-time price in USD (0 = free, -1 = custom/contact). */
  priceUsd: number;
}

export const TIER_CONFIGS: Record<TierId, TierConfig> = {
  architect: {
    id: 'architect',
    credits: 1,
    maxBlueprints: 1,
    allowedFrameworks: ALL_FRAMEWORKS,
    canExportCalendar: true,
    canExportPdf: true,
    priorityAi: false,
    priceUsd: 0,
  },
  standard: {
    id: 'standard',
    credits: 5,
    maxBlueprints: 5,
    allowedFrameworks: ALL_FRAMEWORKS,
    canExportCalendar: true,
    canExportPdf: true,
    priorityAi: false,
    priceUsd: 5.99,
  },
  max: {
    id: 'max',
    credits: 20,
    maxBlueprints: 20,
    allowedFrameworks: ALL_FRAMEWORKS,
    canExportCalendar: true,
    canExportPdf: true,
    priorityAi: true,
    priceUsd: 12.99,
  },
  enterprise: {
    id: 'enterprise',
    credits: -1,
    maxBlueprints: -1,
    allowedFrameworks: ALL_FRAMEWORKS,
    canExportCalendar: true,
    canExportPdf: true,
    priorityAi: true,
    priceUsd: -1,
  },
};

/** Check if a framework is allowed for the given tier. All tiers currently have all frameworks. */
export function canUseFramework(tierId: TierId | undefined, frameworkId: FrameworkId): boolean {
  const tier = (tierId != null && TIER_CONFIGS[tierId]) ? TIER_CONFIGS[tierId] : TIER_CONFIGS[DEFAULT_TIER_ID];
  return tier.allowedFrameworks.includes(frameworkId);
}

/** Default tier for new or unauthenticated users. */
export const DEFAULT_TIER_ID: TierId = 'architect';

export function canExportCalendar(tierId: TierId): boolean {
  return TIER_CONFIGS[tierId]?.canExportCalendar ?? false;
}

export function canExportPdf(tierId: TierId): boolean {
  return TIER_CONFIGS[tierId]?.canExportPdf ?? false;
}
