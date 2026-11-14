"use client";

import { useActionState } from "react";
import {
  User,
  Phone,
  Mail,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type AuthActionResult } from "../actions";

interface ProfileFormProps {
  initialProfile: {
    email: string;
    fullName: string;
    phone: string;
  };
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3.5 text-xs sm:text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && state.message && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 sm:text-sm dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Email (Read Only) */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Alamat Email (Akun)</Label>
        <div className="relative">
          <Mail className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            id="email"
            value={initialProfile.email}
            disabled
            className="bg-muted/50 cursor-not-allowed pl-9"
          />
        </div>
        <p className="text-muted-foreground text-[11px]">
          Email akun dikelola oleh penyedia autentikasi Supabase.
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Nama Lengkap</Label>
        <div className="relative">
          <User className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            id="fullName"
            name="fullName"
            defaultValue={initialProfile.fullName}
            required
            className="pl-9"
            autoComplete="name"
          />
        </div>
      </div>

      {/* Phone Number */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Nomor Telepon / WhatsApp</Label>
        <div className="relative">
          <Phone className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            id="phone"
            name="phone"
            defaultValue={initialProfile.phone}
            placeholder="081234567890"
            className="pl-9"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan Perubahan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Profil
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
