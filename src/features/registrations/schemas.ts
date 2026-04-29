// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1
// @cross_cutting: FR-02 (NIK format), NFR-01 (PII handled server-side only)

import { z } from 'zod';

const NIK_PATTERN = /^[0-9]{16}$/;
const KK_PATTERN = /^[0-9]{16}$/;

// Indonesian phone numbers: +62 prefix or local 0-prefixed, allow E.164 inbound
const PHONE_PATTERN = /^(\+62|62|0)[2-9][0-9]{7,11}$/;

export const submitRegistrationSchema = z.object({
  nik: z
    .string()
    .regex(NIK_PATTERN, 'NIK must be exactly 16 digits'),
  kk: z
    .string()
    .regex(KK_PATTERN, 'KK must be exactly 16 digits'),
  selfieUrl: z
    .string()
    .url('Selfie URL must be a valid URL')
    .refine(
      (u) => u.startsWith('https://'),
      'Selfie must be uploaded over HTTPS'
    ),
  phone: z
    .string()
    .regex(PHONE_PATTERN, 'Phone number must be a valid Indonesian number'),
});

export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>;
