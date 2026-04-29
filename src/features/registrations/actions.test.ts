// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock hoisting — inline literals only (per qa-os strategy)
vi.mock('@/lib/auth/server', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: '770e8400-e29b-41d4-a716-446655440000', email: 'cust@example.com' },
    role: 'customer',
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    rpc: vi.fn().mockResolvedValue({
      data: '550e8400-e29b-41d4-a716-446655440001',
      error: null,
    }),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

import { submitRegistrationAction } from './actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';

const validInput = {
  nik: '3201230101234567',
  kk: '3201230101234560',
  selfieUrl: 'https://storage.example/sims/abc.jpg',
  phone: '+6281234567890',
};

describe('FR-01 — submitRegistrationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success with registrationId on the happy path', async () => {
    const result = await submitRegistrationAction(validInput);
    expect(result).toEqual({
      success: true,
      data: { registrationId: '550e8400-e29b-41d4-a716-446655440001' },
    });
  });

  it('returns VALIDATION_ERROR for invalid input', async () => {
    const result = await submitRegistrationAction({ ...validInput, nik: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects unauthenticated callers (Zone 1 auth bypass test)', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('UNAUTHORIZED'));
    await expect(submitRegistrationAction(validInput)).rejects.toThrow();
  });

  it('maps RPC 22023 (invalid format from DB layer) to VALIDATION_ERROR', async () => {
    const supabase = await createSupabaseServerClient();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: '22023', message: 'invalid_nik_format' } as never,
    });
    const result = await submitRegistrationAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('maps RPC 42501 to UNAUTHORIZED', async () => {
    const supabase = await createSupabaseServerClient();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'unauthenticated' } as never,
    });
    const result = await submitRegistrationAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('maps unexpected RPC errors to DATABASE_ERROR with no detail leakage', async () => {
    const supabase = await createSupabaseServerClient();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: 'XX000', message: 'internal: encryption key missing in private.config' } as never,
    });
    const result = await submitRegistrationAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      // Critical: the user-facing message MUST NOT leak the raw RPC message.
      expect(result.error.message).not.toContain('encryption key');
      expect(result.error.message).not.toContain('private.config');
    }
  });

  it('NFR-01: never logs NIK or KK on error path', async () => {
    const supabase = await createSupabaseServerClient();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: '22023', message: 'invalid_nik_format' } as never,
    });
    await submitRegistrationAction(validInput);
    const calls = vi.mocked(logger.error).mock.calls;
    for (const call of calls) {
      const payload = JSON.stringify(call);
      expect(payload).not.toContain(validInput.nik);
      expect(payload).not.toContain(validInput.kk);
    }
  });
});
