"use client";

import { ActionAlert, runAction } from "@/components/ui/action-feedback";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { useActionState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { updatePasswordAction, type AuthActionResult } from "../actions";

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(
    async (previous, formData) =>
      runAction(
        () => updatePasswordAction(previous, formData),
        false,
        "inline"
      ),
    null
  );

  if (state?.success && state.message) {
    return (
      <div className="space-y-4">
        <ActionAlert
          variant="success"
          title="Kata sandi diperbarui"
          message={state.message}
        />
        <Button asChild className="w-full">
          <Link href="/login">Masuk dengan Kata Sandi Baru</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FieldGroup className="gap-4">
        {state?.error && (
          <ActionAlert variant="destructive" message={state.error} />
        )}

        <Field>
          <FieldLabel htmlFor="password">Kata Sandi Baru</FieldLabel>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">
            Konfirmasi Kata Sandi Baru
          </FieldLabel>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi kata sandi baru"
              required
              minLength={6}
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
        </Field>

        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              Simpan Kata Sandi Baru
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
