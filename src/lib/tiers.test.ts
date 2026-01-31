import { describe, it, expect } from 'vitest';
import { TIER_CONFIGS, canUseFramework, canExportCalendar, canExportPdf, TierId } from '@/lib/tiers';

describe('Tier Configuration', () => {
    it('Architect (Free) tier should have limited access', () => {
        const tier = 'architect';
        // Check Frameworks
        expect(canUseFramework(tier, 'first-principles')).toBe(true);
        expect(canUseFramework(tier, 'pareto')).toBe(true);
        expect(canUseFramework(tier, 'eisenhower')).toBe(false); // Locked
        expect(canUseFramework(tier, 'okr')).toBe(false); // Locked

        // Check Exports
        expect(canExportCalendar(tier)).toBe(false);
        expect(canExportPdf(tier)).toBe(false);
    });

    it('Standard tier should have specific limits', () => {
        const tier = 'standard';
        expect(canUseFramework(tier, 'first-principles')).toBe(true);
        expect(canUseFramework(tier, 'okr')).toBe(true); // Unlocked
        
        expect(canExportCalendar(tier)).toBe(false);
        expect(canExportPdf(tier)).toBe(false);
        
        expect(TIER_CONFIGS[tier].credits).toBe(15);
    });

    it('Max tier should have full access', () => {
        const tier = 'max';
        expect(canUseFramework(tier, 'okr')).toBe(true);
        expect(canExportCalendar(tier)).toBe(true);
        expect(canExportPdf(tier)).toBe(true);
        expect(TIER_CONFIGS[tier].credits).toBe(40);
    });

    it('Enterprise tier should have infinite limits', () => {
        const tier = 'enterprise';
        expect(canUseFramework(tier, 'okr')).toBe(true);
        expect(canExportCalendar(tier)).toBe(true);
        expect(canExportPdf(tier)).toBe(true);
        expect(TIER_CONFIGS[tier].credits).toBe(-1);
    });
});
