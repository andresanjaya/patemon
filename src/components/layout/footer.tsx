import Link from "next/link";
import { ShieldAlert, MessageCircle } from "lucide-react";
import { formatSupportWhatsAppLink } from "@/features/payments/support";

export function Footer() {
  return (
    <footer className="border-border bg-card text-card-foreground border-t">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Safety Note & Adat Principles Callout */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            <strong className="text-foreground font-semibold">
              Prinsip Desa, Kala, Patra:
            </strong>{" "}
            Patemon menyediakan referensi dan alat manajemen terstruktur untuk
            upacara pernikahan Hindu Bali (<em>Pawiwahan</em>). Aplikasi ini
            bukan pengganti panduan langsung dari keluarga, serati banten,
            pemangku, sulinggih, atau prajuru adat setempat.
          </div>
        </div>

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <p>
            © 2026 Patemon — Bali Hindu Wedding Planner. Semua hak dilindungi.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/pricing"
              className="hover:text-foreground transition-colors"
            >
              Biaya & Lisensi
            </Link>
            <a
              href={formatSupportWhatsAppLink({ category: "other" })}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Bantuan WhatsApp</span>
            </a>
            <Link
              href="https://github.com/andresanjaya/patemon"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub Repository
            </Link>
            <Link
              href="https://github.com/andresanjaya/patemon/blob/main/docs/PRD-MVP-v1.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Dokumentasi PRD
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
