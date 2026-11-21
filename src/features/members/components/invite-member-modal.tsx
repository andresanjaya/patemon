"use client";

import {
  FieldTitle,
  FieldLabel,
  FieldGroup,
  Field,
  FieldDescription,
} from "@/components/ui/field";
import { useState } from "react";
import { UserPlus, Mail, AlertCircle, Loader2, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/features/workspaces/types";
import { ROLE_CONFIG } from "../types";
import { inviteWorkspaceMemberAction } from "../actions";

interface InviteMemberModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function InviteMemberModal({
  weddingId,
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await inviteWorkspaceMemberAction({
        weddingId,
        email,
        role,
      });

      if (res.success) {
        onSuccess(res.message || "Undangan berhasil dikirim.");
        setEmail("");
        setRole("editor");
        onClose();
      } else {
        setError(res.error || "Gagal mengirim undangan.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
      <Card
        className="border-border/80 w-full max-w-lg shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-member-title"
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle id="invite-member-title" className="text-lg">
                  Undang Anggota Keluarga
                </CardTitle>
                <CardDescription className="text-xs">
                  Berikan akses kolaborasi perencanaan pawiwahan sesuai peran
                  keluarga
                </CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <CardContent className="space-y-4">
              {error && (
                <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-lg border p-3 text-xs">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <Field>
                <FieldLabel htmlFor="invite-email" className="font-semibold">
                  Alamat Email Anggota / Panitia
                </FieldLabel>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="keluarga@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 text-sm"
                    autoComplete="off"
                  />
                </div>
                <FieldDescription className="text-muted-foreground">
                  Jika email sudah terdaftar di Patemon, akses langsung aktif.
                  Jika belum, undangan akan aktif setelah mereka mendaftar.
                </FieldDescription>
              </Field>

              {/* Role Selection */}
              <Field className="pt-1">
                <FieldTitle className="font-semibold">
                  Tingkat Peran & Hak Akses (Role)
                </FieldTitle>

                <div className="grid grid-cols-1 gap-2.5">
                  {(["editor", "viewer", "owner"] as WorkspaceRole[]).map(
                    (roleKey) => {
                      const cfg = ROLE_CONFIG[roleKey];
                      const isSelected = role === roleKey;

                      return (
                        <div
                          key={roleKey}
                          onClick={() => setRole(roleKey)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border/60 hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                aria-label={cfg.label}
                                name="role"
                                checked={isSelected}
                                onChange={() => setRole(roleKey)}
                                className="text-primary h-4 w-4"
                              />
                              <span className="text-foreground text-sm font-semibold">
                                {cfg.label}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${cfg.badgeClass}`}
                            >
                              {roleKey.toUpperCase()}
                            </Badge>
                          </div>
                          <FieldDescription className="text-muted-foreground mt-1 pl-6 leading-normal">
                            {cfg.description}
                          </FieldDescription>
                        </div>
                      );
                    }
                  )}
                </div>
              </Field>
            </CardContent>

            <CardFooter className="border-border/40 flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Kirim Undangan
                  </>
                )}
              </Button>
            </CardFooter>
          </FieldGroup>
        </form>
      </Card>
    </div>
  );
}
