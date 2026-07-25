import { describe, it, expect } from 'vitest';
import { generateSecureId } from './crypto';

describe('crypto', () => {
    describe('generateSecureId', () => {
        it('generates a string of default length', () => {
            const id = generateSecureId();
            expect(id.length).toBe(6);
        });

        it('generates a string of requested length', () => {
            const id = generateSecureId(10);
            expect(id.length).toBe(10);
        });

        it('generates a string longer than 32 chars', () => {
            const id = generateSecureId(50);
            expect(id.length).toBe(50);
        });

        it('returns only uppercase letters and numbers', () => {
             const id = generateSecureId(100);
             expect(/^[A-Z0-9]+$/.test(id)).toBe(true);
        });
    });
});
