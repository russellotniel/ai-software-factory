// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { submitRegistrationSchema } from './schemas';

const validInput = {
  nik: '3201230101234567',
  kk: '3201230101234560',
  selfieUrl: 'https://storage.example/sims/abc.jpg',
  phone: '+6281234567890',
};

describe('FR-01 — submitRegistrationSchema', () => {
  it('accepts valid input', () => {
    const result = submitRegistrationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects NIK shorter than 16 digits (FR-02 cross-validation)', () => {
    const result = submitRegistrationSchema.safeParse({
      ...validInput,
      nik: '320123010123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects NIK longer than 16 digits', () => {
    const result = submitRegistrationSchema.safeParse({
      ...validInput,
      nik: '32012301012345670',
    });
    expect(result.success).toBe(false);
  });

  it('rejects NIK containing non-digit characters', () => {
    const result = submitRegistrationSchema.safeParse({
      ...validInput,
      nik: '320123010123ABCD',
    });
    expect(result.success).toBe(false);
  });

  it('rejects insecure HTTP selfie URL', () => {
    const result = submitRegistrationSchema.safeParse({
      ...validInput,
      selfieUrl: 'http://storage.example/sims/abc.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = submitRegistrationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  // Zone 1: property-based tests for input validation (per qa-os strategy)
  it('accepts every valid 16-digit NIK (property-based)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 16, maxLength: 16, unit: fc.constantFrom(...'0123456789'.split('')) }),
        (nik) => {
          const result = submitRegistrationSchema.safeParse({ ...validInput, nik });
          return result.success === true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('rejects every NIK whose length is not 16 (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }).filter((n) => n !== 16),
        (length) => {
          const nik = '1'.repeat(length);
          const result = submitRegistrationSchema.safeParse({ ...validInput, nik });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
