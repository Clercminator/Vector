import { describe, it, expect } from 'vitest';
import { TIER_CONFIGS, canUseFramework, canExportCalendar, canExportPdf, TierId } from '@/lib/tiers';

describe('Tier Configuration', () => {
    it('Architect (Free) tier has 1 plan with full experience', () => {
        const tier = 'architect';
        expect(canUseFramework(tier, 'first-principles')).toBe(true);
        expect(canUseFramework(tier, 'eisenhower')).toBe(true);
        expect(canUseFramework(tier, 'okr')).toBe(true);
        expect(canExportCalendar(tier)).toBe(true);
        expect(canExportPdf(tier)).toBe(true);
        expect(TIER_CONFIGS[tier].credits).toBe(1);
    });

    it('Standard (Builder) tier has 5 plans', () => {
        const tier = 'standard';
        expect(canUseFramework(tier, 'okr')).toBe(true);
        expect(canExportCalendar(tier)).toBe(true);
        expect(canExportPdf(tier)).toBe(true);
        expect(TIER_CONFIGS[tier].credits).toBe(5);
    });

    it('Max tier has 20 plans and priority AI', () => {
        const tier = 'max';
        expect(canUseFramework(tier, 'okr')).toBe(true);
        expect(canExportCalendar(tier)).toBe(true);
        expect(canExportPdf(tier)).toBe(true);
        expect(TIER_CONFIGS[tier].credits).toBe(20);
    });

    it('Enterprise tier should have infinite limits', () => {
        const tier = 'enterprise';
        expect(canUseFramework(tier, 'okr')).toBe(true);
        expect(canExportCalendar(tier)).toBe(true);
        expect(canExportPdf(tier)).toBe(true);
        expect(TIER_CONFIGS[tier].credits).toBe(-1);
    });
});
