import type { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  BookOpen,
  CreditCard,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSupportWhatsAppLink } from "@/features/payments/support";

export const metadata: Metadata = {
  title: "Pusat Bantuan & FAQ Pawiwahan | Patemon",
  description:
    "Pertanyaan yang sering diajukan mengenai perencanaan upacara pernikahan Hindu Bali, biaya lisensi, banten, dan kolaborasi keluarga di Patemon.",
};

const FAQ_ITEMS = [
  {
    category: "Adat & Budaya",
    icon: Sparkles,
    questions: [
      {
        q: "Apakah Patemon menggantikan petunjuk Ida Pedanda atau Pemangku keluarga?",
        a: "Tidak. Patemon dirancang sebagai alat pengorganisasian terstruktur untuk membantu mempelai dan keluarga mendokumentasikan, menghitung, dan membagi tugas. Kami selalu menjunjung prinsip Desa, Kala, Patra dan Desa Mawacara — segala keputusan suci tetap merujuk pada piteket Sulinggih dan tetua keluarga Anda.",
      },
      {
        q: "Bagaimana jika urutan prosesi adat di desa kami berbeda dengan template Patemon?",
        a: "Sangat fleksibel! Anda dapat mengedit judul, menambah prosesi khusus dresta lokal (misalnya Makala-kalaan khas Gianyar atau Mejajar Pagar), mengubah urutan waktu, atau menandai prosesi yang tidak dilaksanakan di keluarga Anda.",
      },
      {
        q: "Apakah Patemon mendukung pernikahan bentuk Nyentana?",
        a: "Ya, sepenuhnya didukung. Pada saat pembuatan workspace, Anda dapat memilih bentuk perkawinan Nyentana (di mana pihak keluarga wanita bertindak sebagai penerima sentana rajeg) dan sistem akan menyesuaikan pembagian anggaran serta lokasi upacara utama di merajan pihak wanita.",
      },
    ],
  },
  {
    category: "Banten & Pengadaan",
    icon: BookOpen,
    questions: [
      {
        q: "Bagaimana jika banten dikerjakan sendiri secara gotong royong (Ngayah)?",
        a: "Patemon memiliki pelacak metode pengadaan: Anda bisa memilih 'Ngayah Keluarga' dan menugaskan kerabat yang bertanggung jawab (misalnya Ibu Kadek atau Krama Istri Banjar), memilih 'Pesan Serati Banten', atau 'Beli Pasar'.",
      },
      {
        q: "Bagaimana cara mencegah biaya banten tercatat ganda di anggaran?",
        a: "Jika Anda telah memesan paket borongan dari Serati Banten (misalnya Paket Banten Bebangkit Rp 15 juta), Anda dapat menandai banten tersebut sebagai bagian dari paket sehingga rincian banten satuan di dalamnya tidak dihitung dua kali pada total anggaran.",
      },
    ],
  },
  {
    category: "Biaya & Lisensi",
    icon: CreditCard,
    questions: [
      {
        q: "Berapa biaya penggunaan Patemon dan bagaimana sistem pembayarannya?",
        a: "Biaya lisensi Patemon adalah Rp 199.000 satu kali bayar per ruang kerja pernikahan (tidak ada langganan bulanan). Kami mendukung pembayaran mudah melalui Transfer Bank BCA dan QRIS (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay), dengan konfirmasi langsung ke WhatsApp Master Admin untuk aktivasi instan 365 hari.",
      },
      {
        q: "Apakah ada kuitansi digital resmi yang bisa dicetak untuk laporan keluarga?",
        a: "Ya. Setelah transaksi berhasil, Anda dapat membuka menu Riwayat & Kuitansi untuk melihat, mengunduh, atau mencetak Kuitansi Digital berstempel resmi lunas (dilengkapi nomor kuitansi unik, rincian PPN, dan cap digital).",
      },
      {
        q: "Bagaimana jika hari pernikahan kami diundur atau ditunda?",
        a: "Lisensi Patemon mencakup masa persiapan hingga 18 bulan. Anda dapat mengubah tanggal perkawinan (Dewasa Ayu) di menu Pengaturan Workspace kapan saja tanpa dikenakan biaya tambahan.",
      },
    ],
  },
  {
    category: "Kolaborasi & Lapangan",
    icon: Users,
    questions: [
      {
        q: "Berapa banyak anggota keluarga yang bisa diundang?",
        a: "Pada lisensi penuh, Anda dapat mengundang hingga 15 anggota tim (keluarga purusa, keluarga pradana, prajuru adat, ketua seksi konsumsi, pemuda STT). Anda dapat mengatur hak akses apakah sebagai Editor (bisa centang tugas) atau Viewer (hanya membaca).",
      },
      {
        q: "Bisakah data diakses atau diekspor saat berada di pura tanpa sinyal internet?",
        a: "Ya. Anda dapat mengunduh seluruh data (Banten, Checklist, Anggaran, Tamu, Rundown) ke berkas CSV yang rapi dan siap cetak atau dibagikan lewat dokumen fisik sebelum hari upacara berlangsung.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-12 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <HelpCircle className="h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Pusat Informasi & FAQ
            </span>
          </div>
          <h1 className="text-foreground font-serif text-3xl font-bold sm:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            Temukan jawaban seputar tata cara adat, pengelolaan banten,
            pembagian anggaran, lisensi, dan kerja sama keluarga di Patemon.
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="space-y-10">
          {FAQ_ITEMS.map((group) => {
            const Icon = group.icon;
            return (
              <section key={group.category} className="space-y-4">
                <div className="border-border/60 flex items-center gap-2.5 border-b pb-2">
                  <Icon className="text-primary h-5 w-5" />
                  <h2 className="text-foreground font-serif text-xl font-bold">
                    {group.category}
                  </h2>
                </div>
                <div className="space-y-4">
                  {group.questions.map((item, idx) => (
                    <div
                      key={idx}
                      className="border-border/60 bg-card rounded-2xl border p-5 sm:p-6"
                    >
                      <h3 className="text-foreground text-base font-bold sm:text-lg">
                        {item.q}
                      </h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Support Callout */}
        <div className="border-border/80 bg-muted/40 mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl border p-6 sm:flex-row sm:p-8">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-foreground text-lg font-bold">
              Punya pertanyaan khusus seputar dresta atau kendala teknis?
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Tim pendamping Patemon siap membantu via chat WhatsApp resmi.
            </p>
          </div>
          <a
            href={formatSupportWhatsAppLink({
              category: "adat_consultation",
              userMessage:
                "Om Swastyastu tim Patemon, saya ingin bertanya perihal...",
            })}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2 bg-emerald-600 text-white shadow-md hover:bg-emerald-700">
              <MessageCircle className="h-4 w-4" />
              Tanya via WhatsApp
            </Button>
          </a>
        </div>
      </main>
    </div>
  );
}
