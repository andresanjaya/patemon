"use client";

import { useState } from "react";
import {
  MessageCircle,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  SUPPORT_TOPICS,
  formatSupportWhatsAppLink,
  type SupportCategory,
} from "../support";

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId?: string;
  coupleNames?: string;
  orderNumber?: string;
  defaultCategory?: SupportCategory;
}

export function CustomerSupportModal({
  isOpen,
  onClose,
  weddingId,
  coupleNames,
  orderNumber,
  defaultCategory = "payment_issue",
}: CustomerSupportModalProps) {
  const [category, setCategory] = useState<SupportCategory>(defaultCategory);
  const [userMessage, setUserMessage] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentTopic =
    SUPPORT_TOPICS.find((t) => t.id === category) || SUPPORT_TOPICS[0];

  const waLink = formatSupportWhatsAppLink({
    category,
    weddingId,
    coupleNames,
    orderNumber,
    userMessage,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(waLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures in unsupported contexts
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-md p-1 transition-colors"
          aria-label="Tutup dialog bantuan"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="text-foreground text-lg font-bold">
              Bantuan & Layanan Pelanggan
            </h3>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Om Swastyastu! Tim admin dan kurator adat Patemon siap membantu
            kendala transaksi, aktivasi lisensi, atau pertanyaan prosesi Anda.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {/* Metadata Context Preview */}
          <div className="border-border/70 bg-muted/30 space-y-2 rounded-xl border p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                Konteks Workspace Anda
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-400"
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                Data Otomatis Terlampir
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">ID Pawiwahan: </span>
                <span className="text-foreground font-mono font-medium">
                  {weddingId || "demo"}
                </span>
              </div>
              {coupleNames && (
                <div>
                  <span className="text-muted-foreground">Mempelai: </span>
                  <span className="text-foreground font-medium">
                    {coupleNames}
                  </span>
                </div>
              )}
              {orderNumber && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">
                    No. Pesanan / Order:{" "}
                  </span>
                  <span className="text-primary font-mono font-semibold">
                    {orderNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Topic / Category Selection */}
          <div className="space-y-2">
            <label className="text-foreground block text-xs font-semibold">
              Pilih Kategori Bantuan:
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUPPORT_TOPICS.map((topic) => {
                const isSelected = category === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setCategory(topic.id)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20"
                        : "border-border/70 bg-card hover:border-border"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-foreground"
                        }`}
                      >
                        {topic.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <span className="text-muted-foreground mt-0.5 line-clamp-1 text-[10px]">
                      {topic.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Message Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="support-message"
              className="text-foreground block text-xs font-semibold"
            >
              Rincian Pertanyaan / Kendala (Opsional):
            </label>
            <Textarea
              id="support-message"
              placeholder={`Ceritakan kendala Anda perihal ${currentTopic.label.toLowerCase()}...`}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="min-h-[75px] resize-none text-xs"
            />
          </div>

          {/* WhatsApp Direct Action */}
          <div className="border-border/60 space-y-3 rounded-2xl border bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-foreground text-xs font-semibold">
                  Koneksi Langsung WhatsApp Resmi
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="text-muted-foreground hover:text-foreground h-6 gap-1 px-2 text-[10px]"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Salin Link</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Pesan akan otomatis dirangkum dengan rapi agar tim admin dapat
              langsung memeriksa transaksi dan lisensi workspace Anda.
            </p>

            <Button
              className="w-full gap-2 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
              asChild
            >
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                <span>Mulai Chat di WhatsApp</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-[10px]">
            Jam Layanan: Senin – Minggu, 08.00 – 21.00 WITA. Respon cepat untuk
            kendala pembayaran.
          </p>
        </div>
      </div>
    </div>
  );
}
