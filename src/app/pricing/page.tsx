import Link from "next/link";
import {
  Check,
  X,
  HelpCircle,
  ArrowRight,
  QrCode,
  CreditCard,
  Building,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PricingSection } from "@/features/payments/components/pricing-section";
import { PRICING_FAQS } from "@/features/payments/pricing";
import { formatSupportWhatsAppLink } from "@/features/payments/support";

export const metadata = {
  title: "Pilihan Paket & Harga Lisensi · Patemon",
  description:
    "Transparansi biaya lisensi perencanaan pernikahan Hindu Bali. Bayar 1x per pawiwahan tanpa biaya langganan bulanan.",
};

export default function PricingPage() {
  const comparisonRows = [
    {
      category: "Perencanaan Upacara & Adat",
      items: [
        {
          feature: "Akses Panduan 30+ Sarana Banten & Upakara Bali",
          free: true,
          paid: true,
        },
        {
          feature: "Pilihan Bentuk Adat (Memadik, Ngerorod, Nyentana)",
          free: true,
          paid: true,
        },
        {
          feature: "Kustomisasi Rangkaian Upacara Tak Terbatas",
          free: "Terbatas Demo",
          paid: true,
        },
        {
          feature: "Pelacakan Pengadaan Banten (Ngayah/Serati/Beli)",
          free: "Hanya Simulasi",
          paid: true,
        },
        {
          feature: "Kalkulator Indeks Kesiapan Pawiwahan (Readiness)",
          free: true,
          paid: true,
        },
      ],
    },
    {
      category: "Kolaborasi Keluarga & Tim Panitia",
      items: [
        {
          feature: "Undang Anggota Keluarga (Owner, Editor, Viewer)",
          free: false,
          paid: "Hingga 15 Anggota",
        },
        {
          feature: "Penugasan PIC Penanggung Jawab Tugas & Banten",
          free: false,
          paid: true,
        },
        {
          feature: "Rundown Panitia Hari-H dengan Estimasi Waktu WITA",
          free: "Pratinjau Standar",
          paid: true,
        },
        {
          feature: "Buku Tamu, Pengelompokan Dadia/Banjar & Headcount",
          free: false,
          paid: true,
        },
      ],
    },
    {
      category: "Anggaran & Vendor",
      items: [
        {
          feature: "Buku Anggaran Adat & Pembagian Beban Purusa/Pradana",
          free: "Contoh Demo",
          paid: true,
        },
        {
          feature: "Pencatatan Riwayat Pembayaran & Bukti DP Vendor",
          free: false,
          paid: true,
        },
        {
          feature: "Daftar Kontak Vendor & Integrasi Chat WhatsApp",
          free: false,
          paid: true,
        },
      ],
    },
    {
      category: "Kontingensi Offline & Arsip Permanen",
      items: [
        {
          feature: "Ekspor CSV Lapangan (Format Excel UTF-8 BOM)",
          free: true,
          paid: true,
        },
        {
          feature: "Cadangan Master Arsip JSON Lengkap",
          free: true,
          paid: true,
        },
        {
          feature: "Akses Baca Arsip Pasca Upacara Seumur Hidup",
          free: false,
          paid: true,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-16 py-10 sm:py-16">
      {/* Top Pricing Cards */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingSection showTitle={true} />
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Perbandingan Detail Kapabilitas Fitur
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Ketahui rincian fitur yang tersedia pada Mode Free Preview
              dibandingkan Akses Penuh Pawiwahan
            </p>
          </div>

          <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-border bg-muted/40 border-b">
                    <th className="text-foreground w-1/2 p-4 font-semibold">
                      Fitur & Kapabilitas
                    </th>
                    <th className="text-foreground w-1/4 p-4 text-center font-semibold">
                      Free Preview
                    </th>
                    <th className="text-primary w-1/4 p-4 text-center font-semibold">
                      Akses Penuh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border/60 divide-y">
                  {comparisonRows.map((section, sIdx) => (
                    <>
                      <tr key={`sec-${sIdx}`} className="bg-muted/20">
                        <td
                          colSpan={3}
                          className="text-foreground px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase"
                        >
                          {section.category}
                        </td>
                      </tr>
                      {section.items.map((row, rIdx) => (
                        <tr
                          key={`row-${sIdx}-${rIdx}`}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="text-foreground p-4 font-medium">
                            {row.feature}
                          </td>
                          <td className="p-4 text-center">
                            {row.free === true ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : row.free === false ? (
                              <X className="text-muted-foreground/50 mx-auto h-4 w-4" />
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                {row.free}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {row.paid === true ? (
                              <Check className="text-primary mx-auto h-4 w-4 stroke-[2.5]" />
                            ) : (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 text-[10px]">
                                {row.paid}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Security & Methods */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="border-border/80 bg-muted/20 flex flex-col items-center justify-between gap-6 rounded-2xl border p-6 sm:p-8 md:flex-row">
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-foreground text-base font-bold">
              Metode Pembayaran Transfer BCA &amp; QRIS
            </h4>
            <p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
              Kami mendukung Transfer Bank BCA dan QRIS (BCA Mobile, Mandiri,
              BRI, BNI, GoPay, OVO, Dana, ShopeePay, LinkAja). Konfirmasi instan
              ke Master Admin melalui WhatsApp untuk aktivasi cepat akses 365
              hari.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Building className="text-primary h-3.5 w-3.5" />
              <span>Transfer Bank BCA</span>
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <QrCode className="text-primary h-3.5 w-3.5" />
              <span>QRIS (Semua E-Wallet)</span>
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <CreditCard className="text-primary h-3.5 w-3.5" />
              <span>Verifikasi Master Admin</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2">
              <HelpCircle className="text-primary h-5 w-5" />
              <h3 className="text-foreground text-2xl font-bold tracking-tight">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h3>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Jawaban seputar lisensi, kebijakan pengembalian, dan masa berlaku
              workspace
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRICING_FAQS.map((faq, idx) => (
              <Card key={idx} className="border-border/80 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm leading-snug font-bold">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customer Support Callout */}
          <div className="border-border/80 bg-muted/20 flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 text-center sm:flex-row sm:text-left">
            <div className="space-y-1">
              <h4 className="text-foreground flex items-center justify-center gap-2 text-sm font-bold sm:justify-start">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>
                  Masih Memiliki Pertanyaan atau Butuh Bantuan Khusus?
                </span>
              </h4>
              <p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
                Tim kurator adat dan admin Patemon siap menjawab pertanyaan
                seputar variasi upacara, pembayaran via BCA / QRIS, atau garansi
                kedaulatan data.
              </p>
            </div>
            <Button
              className="shrink-0 gap-2 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              asChild
            >
              <a
                href={formatSupportWhatsAppLink({
                  category: "adat_consultation",
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Chat Admin WhatsApp</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="border-primary/30 from-primary/10 to-primary/10 relative space-y-5 overflow-hidden rounded-3xl border bg-gradient-to-r via-amber-500/10 p-8 text-center sm:p-12">
          <h3 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
            Mulai Rencanakan Hari Bahagia Bersama Patemon
          </h3>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xs leading-relaxed sm:text-sm">
            Daftar sekarang untuk mencoba alur perencanaan dan mulai menyusun
            prosesi pawiwahan adat Bali Anda dengan tertata dan transparan.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="gap-2 text-xs font-semibold">
              <Link href="/register">
                <span>Daftar Akun Baru</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-2 text-xs"
            >
              <Link href="/workspace/demo">
                <span>Coba Demo Gratis</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
