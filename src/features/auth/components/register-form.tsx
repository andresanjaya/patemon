"use client";

import { useActionState, useState } from "react";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyAuthErrorMessage } from "../errors";
import { signUpWithEmailAction, type AuthActionResult } from "../actions";

interface RegisterFormProps {
  initialError?: string;
}

export function RegisterForm({ initialError }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signUpWithEmailAction, null);

  const [clientError, setClientError] = useState<string | null>(
    initialError ? getFriendlyAuthErrorMessage(initialError) : null
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      setClientError(null);

      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const redirectCallbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(
        "/workspaces"
      )}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectCallbackUrl,
        },
      });

      if (error) {
        setClientError(getFriendlyAuthErrorMessage(error));
        setIsGoogleLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setClientError(getFriendlyAuthErrorMessage(err));
      setIsGoogleLoading(false);
    }
  };

  const activeError = state?.error || clientError;

  if (state?.success && state.message) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h3 className="text-foreground font-semibold">
          Konfirmasi Email Terkirim
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {activeError && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3.5 text-xs sm:text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        className="border-border w-full gap-2"
        onClick={handleGoogleSignup}
        disabled={isPending || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        Daftar dengan Google
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <span className="bg-card text-muted-foreground relative px-3 text-xs tracking-wider uppercase">
          atau isi formulir
        </span>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <div className="relative">
            <User className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="I Made Dharma"
              required
              className="pl-9"
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Alamat Email</Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Kata Sandi</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi kata sandi"
              required
              minLength={6}
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mendaftarkan...
            </>
          ) : (
            <>
              Buat Akun Patemon
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
