'use client';
// @spec: submit-registration
// @urs: FR-01
// @risk_zone: 1

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { submitRegistrationAction } from '../actions';
import {
  submitRegistrationSchema,
  type SubmitRegistrationInput,
} from '../schemas';

type Props = {
  selfieUrl: string;
};

type FieldOf<K extends keyof SubmitRegistrationInput> = ControllerRenderProps<
  SubmitRegistrationInput,
  K
>;

export function SubmitRegistrationForm({ selfieUrl }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SubmitRegistrationInput>({
    resolver: zodResolver(submitRegistrationSchema),
    defaultValues: {
      nik: '',
      kk: '',
      phone: '',
      selfieUrl,
    },
  });

  const onSubmit = async (values: SubmitRegistrationInput) => {
    setServerError(null);
    const result = await submitRegistrationAction(values);
    if (result.success) {
      router.push(`/registrations/${result.data.registrationId}/status`);
      return;
    }
    setServerError(result.error.message);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="nik"
          render={({ field }: { field: FieldOf<'nik'> }) => (
            <FormItem>
              <FormLabel>NIK</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={16}
                  autoComplete="off"
                  placeholder="3201230101234567"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                16-digit national identity number from your KTP.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kk"
          render={({ field }: { field: FieldOf<'kk'> }) => (
            <FormItem>
              <FormLabel>KK number</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={16}
                  autoComplete="off"
                  placeholder="3201230101234560"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                16-digit family card number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }: { field: FieldOf<'phone'> }) => (
            <FormItem>
              <FormLabel>Phone number to activate</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+62 812 3456 7890"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The number this SIM will activate under.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p
            className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Submitting…' : 'Submit registration'}
        </Button>

        <p className="text-xs text-muted-foreground">
          By submitting you authorise XLSmart to encrypt and store your NIK
          and KK in compliance with Kominfo PP No. 28/2017. Your data is
          encrypted at rest and never displayed in plaintext.
        </p>
      </form>
    </Form>
  );
}
