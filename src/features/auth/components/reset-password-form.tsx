"use client";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { useActionState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { requestPasswordResetAction, type AuthActionResult } from "../actions";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(requestPasswordResetAction, null);

  if (state?.success && state.message) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h3 className="text-foreground font-semibold">Tautan Terkirim</h3>
        <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
          {state.message}
        </p>
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
          <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3.5 text-xs sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
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
