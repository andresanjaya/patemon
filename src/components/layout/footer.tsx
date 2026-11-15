import Link from "next/link";
import { ShieldAlert, MessageCircle } from "lucide-react";
import { formatSupportWhatsAppLink } from "@/features/payments/support";

export function Footer() {
  return (
    <footer className="border-t border-[#ffffff1a] bg-[#233f36] text-[#c9d3c7]">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Safety Note & Adat Principles Callout */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-[#e4c874]/30 bg-[#2b4c41]/50 p-4 sm:p-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#e4c874]" />
          <div className="text-xs leading-relaxed text-[#c9d3c7] sm:text-sm">
            <strong className="font-semibold text-white">
              Prinsip Desa, Kala, Patra:
            </strong>{" "}
            Patemon menyediakan referensi dan alat manajemen terstruktur untuk
            upacara pernikahan Hindu Bali (<em>Pawiwahan</em>). Aplikasi ini
            bukan pengganti panduan langsung dari keluarga, serati banten,
            pemangku, sulinggih, atau prajuru adat setempat.
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[#a3b1a0] sm:flex-row">
          <p>
            © 2026{" "}
            <span className="font-editorial text-sm font-semibold text-white">
              patemon.
            </span>{" "}
            — Tradisi terjaga. Keluarga terhubung.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/#how-it-works"
              className="transition-colors hover:text-[#e4c874]"
            >
              Cara Kerja
            </Link>
            <Link
              href="/pricing"
              className="transition-colors hover:text-[#e4c874]"
            >
              Biaya & Lisensi
            </Link>
            <Link
              href="/faq"
              className="transition-colors hover:text-[#e4c874]"
            >
              FAQ / Bantuan
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[#e4c874]"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-[#e4c874]"
            >
              Syarat & Ketentuan
            </Link>
            <a
              href={formatSupportWhatsAppLink({ category: "other" })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[#e4c874]"
            >
              <MessageCircle className="h-3.5 w-3.5 text-[#e4c874]" />
              <span>Bantuan WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
