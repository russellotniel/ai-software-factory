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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nik"
          render={({ field }: { field: FieldOf<'nik'> }) => (
            <FormItem>
              <FormLabel>NIK (16 digits)</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={16}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kk"
          render={({ field }: { field: FieldOf<'kk'> }) => (
            <FormItem>
              <FormLabel>KK (16 digits)</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={16}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }: { field: FieldOf<'phone'> }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm text-destructive" role="alert">
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
      </form>
    </Form>
  );
}
