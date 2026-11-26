"use client";

import { ActionAlert, runAction } from "@/components/ui/action-feedback";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { useActionState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { requestPasswordResetAction, type AuthActionResult } from "../actions";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(
    async (previous, formData) =>
      runAction(
        () => requestPasswordResetAction(previous, formData),
        false,
        "inline"
      ),
    null
  );

  if (state?.success && state.message) {
    return (
      <div className="space-y-4">
        <ActionAlert
          variant="info"
          title="Tautan Terkirim"
          message={state.message}
        />
        <Button variant="outline" asChild className="w-full">
          <Link href="/login" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Halaman Masuk
          </Link>
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
          <FieldLabel htmlFor="email">Alamat Email Terdaftar</FieldLabel>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
              className="pl-9"
              autoComplete="email"
            />
          </div>
        </Field>

        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim tautan...
            </>
          ) : (
            <>
              Kirim Tautan Atur Ulang
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
