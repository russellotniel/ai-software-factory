'use server';
// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1
// @cross_cutting: FR-02 (NIK format), NFR-01 (encryption), UR-01 (Customer scope)

import { requireAuth } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { ActionResult } from '@/types/actions';

import {
  submitRegistrationSchema,
  type SubmitRegistrationInput,
} from './schemas';

export async function submitRegistrationAction(
  input: SubmitRegistrationInput
): Promise<ActionResult<{ registrationId: string }>> {
  // 1. Authenticate
  const { user } = await requireAuth();

  // 2. Validate
  const parsed = submitRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input.',
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  // 3. Execute via the canonical RPC — handles encryption + region derivation
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('submit_registration', {
    p_nik: parsed.data.nik,
    p_kk: parsed.data.kk,
    p_selfie_url: parsed.data.selfieUrl,
    p_phone: parsed.data.phone,
  });

  if (error) {
    logger.error('submitRegistrationAction: RPC failed', {
      action: 'submitRegistrationAction',
      userId: user.id,
      errorCode: error.code,
      // Do NOT log NIK/KK — they are PII (NFR-01).
    });

    // Map known error codes from the RPC to client-friendly errors.
    if (error.code === '22023') {
      // RPC raised invalid_nik_format / invalid_kk_format / profile_missing_region
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Registration data could not be processed.',
        },
      };
    }
    if (error.code === '42501') {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      };
    }
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to submit registration.',
      },
    };
  }

  return { success: true, data: { registrationId: data as string } };
}
