"use client";

import { ActionAlert, runAction } from "@/components/ui/action-feedback";

import {
  FieldLabel,
  FieldGroup,
  Field,
  FieldDescription,
} from "@/components/ui/field";
import { useActionState } from "react";
import { User, Phone, Mail, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  >(
    async (previous, formData) =>
      runAction(() => updateProfileAction(previous, formData), false, "inline"),
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <FieldGroup className="gap-4">
        {state?.error && (
          <ActionAlert variant="destructive" message={state.error} />
        )}

        {state?.success && state.message && (
          <ActionAlert variant="success" message={state.message} />
        )}

        {/* Email (Read Only) */}
        <Field>
          <FieldLabel htmlFor="email">Alamat Email (Akun)</FieldLabel>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="email"
              value={initialProfile.email}
              disabled
              className="bg-muted/50 cursor-not-allowed pl-9"
            />
          </div>
          <FieldDescription className="text-muted-foreground">
            Email akun dikelola oleh penyedia autentikasi Supabase.
          </FieldDescription>
        </Field>

        {/* Full Name */}
        <Field>
          <FieldLabel htmlFor="fullName">Nama Lengkap</FieldLabel>
          <div className="relative">
            <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="fullName"
              name="fullName"
              defaultValue={initialProfile.fullName}
              required
              className="pl-9"
              autoComplete="name"
            />
          </div>
        </Field>

        {/* Phone Number */}
        <Field>
          <FieldLabel htmlFor="phone">Nomor Telepon / WhatsApp</FieldLabel>
          <div className="relative">
            <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="phone"
              name="phone"
              defaultValue={initialProfile.phone}
              placeholder="081234567890"
              className="pl-9"
              autoComplete="tel"
            />
          </div>
        </Field>

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
      </FieldGroup>
    </form>
  );
}
