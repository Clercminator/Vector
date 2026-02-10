/**
 * Tier configuration: credits, allowed frameworks, and feature flags.
 * Use this to enforce limits in GoalWizard, Dashboard, and export flows.
 * IDs: architect (free), standard (paid), max (premium), enterprise (contact).
 */

export type FrameworkId = 'first-principles' | 'pareto' | 'rpm' | 'eisenhower' | 'okr' | 'dsss' | 'mandalas' | 'gps' | 'misogi' | 'general';

/** Frameworks available on free tier (first 3). Standard and Max get all. */
export const FREE_TIER_FRAMEWORKS: FrameworkId[] = ['first-principles', 'pareto', 'rpm', 'general'];

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
  'general',
];

export type TierId = 'architect' | 'standard' | 'max' | 'enterprise';

export interface TierConfig {
  id: TierId;
  /** Credits granted (free tier uses a default in DB; paid tiers grant on purchase). */
  credits: number;
  /** Max blueprints saved (0 = use default from product). */
  maxBlueprints: number;
  /** Framework IDs the user can run. */
  allowedFrameworks: FrameworkId[];
  canExportCalendar: boolean;
  canExportPdf: boolean;
  /** Priority / higher-quality AI (e.g. better model or longer context). */
  priorityAi: boolean;
  /** One-time price in USD (0 = free, -1 = custom/contact). */
  priceUsd: number;
}

export const TIER_CONFIGS: Record<TierId, TierConfig> = {
  architect: {
    id: 'architect',
    credits: 5,
    maxBlueprints: 5,
    allowedFrameworks: FREE_TIER_FRAMEWORKS,
    canExportCalendar: false,
    canExportPdf: false,
    priorityAi: false,
    priceUsd: 0,
  },
  standard: {
    id: 'standard',
    credits: 15,
    maxBlueprints: 50,
    allowedFrameworks: ALL_FRAMEWORKS,
    canExportCalendar: false,
    canExportPdf: false,
    priorityAi: false,
    priceUsd: 19,
  },
  max: {
    id: 'max',
    credits: 40,
    maxBlueprints: 200,
    allowedFrameworks: ALL_FRAMEWORKS,
    canExportCalendar: true,
    canExportPdf: true,
    priorityAi: true,
    priceUsd: 39,
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

/** Check if a framework is allowed for the given tier. */
export function canUseFramework(tierId: TierId, frameworkId: FrameworkId): boolean {
  const tier = TIER_CONFIGS[tierId];
  if (!tier) return false;
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
