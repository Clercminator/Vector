import { describe, it, expect } from 'vitest';
import { blueprintTitleFromAnswers, upsertBlueprint, removeBlueprint, Blueprint } from './blueprints';

describe('blueprints utility', () => {
    describe('blueprintTitleFromAnswers', () => {
        it('should use the first answer as title', () => {
            const answers = ['My Awesome Goal', 'Reason', 'Plan'];
            expect(blueprintTitleFromAnswers(answers)).toBe('My Awesome Goal');
        });

        it('should truncate long titles', () => {
            const longAnswer = 'This is a very long answer that should ideally be truncated because it exceeds the sixty character limit that we have set for titles';
            const title = blueprintTitleFromAnswers([longAnswer]);
            expect(title.length).toBeLessThanOrEqual(60);
            expect(title).toMatch(/\.\.\.$/);
        });

        it('should use fallback if answer is empty', () => {
            expect(blueprintTitleFromAnswers([])).toBe('Untitled blueprint');
            expect(blueprintTitleFromAnswers(['   '])).toBe('Untitled blueprint');
        });
    });

    describe('Local Blueprint Operations', () => {
        const mockBlueprint: Blueprint = {
            id: '123',
            framework: 'first-principles',
            title: 'Test BP',
            answers: [],
            result: { type: 'first-principles', truths: [], newApproach: '' },
            createdAt: new Date().toISOString()
        };

        it('upsertBlueprint should add new blueprint to empty list', () => {
            const outcome = upsertBlueprint([], mockBlueprint);
            expect(outcome).toHaveLength(1);
            expect(outcome[0]).toEqual(mockBlueprint);
        });

        it('upsertBlueprint should update existing blueprint', () => {
            const initial = [mockBlueprint];
            const updated = { ...mockBlueprint, title: 'Updated Title' };
            const outcome = upsertBlueprint(initial, updated);
            expect(outcome).toHaveLength(1);
            expect(outcome[0].title).toBe('Updated Title');
        });

        it('removeBlueprint should remove by id', () => {
            const initial = [mockBlueprint];
            const outcome = removeBlueprint(initial, '123');
            expect(outcome).toHaveLength(0);
        });

        it('removeBlueprint should do nothing if id not found', () => {
            const initial = [mockBlueprint];
            const outcome = removeBlueprint(initial, '999');
            expect(outcome).toHaveLength(1);
        });
    });
});
