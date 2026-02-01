import { describe, it, expect } from 'vitest';
import * as math from 'mathjs';

describe('Hardened Math Tool', () => {
    it('should evaluate safe expressions', () => {
        const result = math.evaluate("10 * 10");
        expect(result).toBe(100);
    });

    it('should evaluate complex expressions', () => {
        const result = math.evaluate("sqrt(16) + 5");
        expect(result).toBe(9);
    });

    it('should NOT allow malicious code', () => {
         // mathjs evaluate prevents access to global context
         expect(() => math.evaluate("import('fs')")).toThrow();
         expect(() => math.evaluate("process.exit()")).toThrow();
         expect(() => math.evaluate("console.log('hack')")).toThrow();
    });
});
