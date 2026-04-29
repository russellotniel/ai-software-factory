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

// Maps the RPC's raised exception messages to user-facing strings.
// Keep messages free of internal detail per error-message-leakage standard.
const RPC_ERROR_MESSAGES: Record<string, string> = {
  invalid_nik_format: 'NIK must be exactly 16 digits.',
  invalid_kk_format: 'KK must be exactly 16 digits.',
  profile_missing_region:
    'Your account is missing a region. Complete onboarding before submitting a registration.',
  unauthenticated: 'You must be signed in to submit a registration.',
};

export async function submitRegistrationAction(
  input: SubmitRegistrationInput
): Promise<ActionResult<{ registrationId: string }>> {
  const { user } = await requireAuth();

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
      errorMessage: error.message,
      // Do NOT log NIK/KK — they are PII (NFR-01).
    });

    // Authentication failure (PostgreSQL 'insufficient_privilege')
    if (error.code === '42501' || error.message === 'unauthenticated') {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: RPC_ERROR_MESSAGES.unauthenticated },
      };
    }

    // Validation failures raised by the RPC body — distinguish by message.
    // Codes 22023 (invalid_parameter_value) for NIK/KK; the same family is
    // used for missing region. Map the message body to a user-facing string.
    if (error.code === '22023' || error.message in RPC_ERROR_MESSAGES) {
      const friendly = RPC_ERROR_MESSAGES[error.message];
      if (friendly) {
        // Profile-missing-region is a workflow problem, not a per-field error.
        // Use FORBIDDEN so the UI can route the user to onboarding rather
        // than re-rendering field errors.
        const code =
          error.message === 'profile_missing_region'
            ? 'FORBIDDEN'
            : 'VALIDATION_ERROR';
        return {
          success: false,
          error: { code, message: friendly },
        };
      }
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Registration data could not be processed.',
        },
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
