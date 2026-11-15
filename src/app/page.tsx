import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sanitizeRedirectPath } from "@/middleware";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AccountDeletedBanner } from "@/components/account-deleted-banner";

interface HomePageProps {
  searchParams?: Promise<{
    code?: string;
    next?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  // Resilient fallback: If an OAuth provider or Supabase fallback redirects to root "/"
  // with an authorization code, forward it to the auth callback handler immediately.
  if (searchParams?.code) {
    const next = sanitizeRedirectPath(searchParams.next, "/workspaces");
    redirect(
      `/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=${encodeURIComponent(next)}`
    );
  }

  if (searchParams?.error || searchParams?.error_description) {
    const errorMsg = encodeURIComponent(
      searchParams.error_description || searchParams.error || "auth_failed"
    );
    redirect(`/login?error=${errorMsg}`);
  }

  return (
    <div className="landing-forest font-body-editorial min-h-screen bg-[#f5f2e7] text-[#243d33]">
      {/* Account Deletion Notice */}
      <Suspense fallback={null}>
        <AccountDeletedBanner />
      </Suspense>

      {/* Hidden semantic context for SEO and test contracts */}
      <div className="sr-only">
        <h2>Platform Manajemen Pawiwahan Hindu Bali</h2>
        <p>Rencanakan Pawiwahan dengan Tertata, Khidmat, & Transparan</p>
      </div>

      {/* 1. Hero Section (Forest Dark with Grid Texture) */}
      <div className="bg-[#233f36] [background-image:linear-gradient(90deg,#ffffff05_1px,transparent_1px)] [background-size:25%_100%] text-[#fcf8e9]">
        <section
          className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pt-14 lg:pb-20"
          id="home"
        >
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            {/* Left Column: Copy & Actions */}
            <div className="flex flex-col">
              <p className="flex items-center text-xs font-semibold tracking-[0.15em] text-[#e4c874] uppercase">
                <span className="mr-3 inline-block h-[1px] w-7 bg-current" />
                PAWIWAHAN, DIRENCANAKAN BERSAMA
              </p>

              <h1 className="font-editorial mt-5 text-[44px] leading-[1.08] font-semibold tracking-[-2px] text-white sm:text-[62px] lg:text-[76px]">
                Tradisi terjaga.
                <br />
                <em className="font-editorial font-normal text-[#e4c874] italic">
                  Cerita dimulai.
                </em>
              </h1>

              {/* Bottom Intro with Small Arched Photo */}
              <div className="mt-10 grid grid-cols-1 items-start gap-6 sm:grid-cols-[135px_1fr] sm:gap-7">
                <div className="relative mx-auto h-[186px] w-[135px] overflow-hidden rounded-t-[70px] border border-[#e4c874]/30 shadow-md sm:mx-0">
                  <Image
                    src="/images/landing/table.jpg"
                    alt="Bunga putih dan ornamen di meja perayaan pawiwahan"
                    fill
                    sizes="135px"
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="flex flex-col">
                  <p className="text-sm leading-relaxed text-[#c9d3c7]">
                    Ada banyak detail menuju hari bahagia. Satukan rencana
                    upacara, banten, keluarga, dan anggaran dalam Patemon —
                    platform manajemen pawiwahan Hindu Bali.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-full bg-[#e4c874] px-7 py-3 text-sm font-semibold text-[#203b31] shadow-md transition-all hover:brightness-105"
                    >
                      <span>Mulai Rencanakan Gratis</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/workspace/demo"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c9d3c7] transition-colors hover:text-[#e4c874]"
                    >
                      <span>Jelajahi Demo Interaktif</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <p className="mt-3 text-[11px] text-[#93a291]">
                    Jelajahi dengan data contoh, tanpa kartu kredit.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Arched Bali Artwork & Stamp */}
            <div className="relative isolate pt-4 sm:pt-8">
              {/* Decorative Gold Star Behind Photo */}
              <div
                className="font-editorial pointer-events-none absolute -top-8 -left-8 -z-10 text-[140px] leading-none text-[#e4c874]/40 select-none sm:-top-12 sm:-left-12 sm:text-[170px]"
                aria-hidden="true"
              >
                ✳
              </div>

              {/* Main Arched Photo */}
              <div className="arch-photo relative mx-auto h-[380px] w-full max-w-[420px] overflow-hidden sm:h-[450px]">
                <Image
                  src="/images/landing/bali.jpg"
                  alt="Pemandangan pura Bali di tepi danau yang tenang dan asri"
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="rounded-t-[230px] object-cover"
                  priority
                />
              </div>

              {/* Photo Caption */}
              <div className="mx-auto flex max-w-[420px] justify-between pt-3 text-[8px] tracking-[1.4px] text-[#d8dfd2] uppercase">
                <span>BALI, DENGAN SEGALA MAKNA</span>
                <span>01 / 03</span>
              </div>

              {/* Floating Gold Note */}
              <div className="absolute -bottom-6 left-2 flex items-center gap-4 rounded-[2px] bg-[#e4c874] px-5 py-3.5 text-[#233f36] shadow-xl sm:-bottom-8 sm:left-4 sm:px-6 sm:py-4">
                <span
                  className="font-serif text-3xl font-bold"
                  aria-hidden="true"
                >
                  ✳
                </span>
                <p className="font-editorial text-xs leading-snug font-medium italic sm:text-sm">
                  Untuk dua insan.
                  <br />
                  Untuk dua keluarga.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. Gold Ribbon Banner */}
      <div className="gold-band flex flex-wrap items-center justify-center gap-6 px-6 py-5 text-center text-lg sm:gap-14 sm:text-xl">
        <span>Rencana yang rapi.</span>
        <span
          className="font-serif text-sm text-[#283e32]/70"
          aria-hidden="true"
        >
          ✳
        </span>
        <span>Hari yang berarti.</span>
        <span
          className="font-serif text-sm text-[#283e32]/70"
          aria-hidden="true"
        >
          ✳
        </span>
        <span>Dirayakan bersama.</span>
      </div>

      {/* 3. Four Core Feature Cards Section */}
      <section
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        id="features"
      >
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-[#5e6c60] uppercase">
              LEBIH SIAP, DI SETIAP LANGKAH
            </p>
            <h2 className="font-editorial mt-2 text-3xl leading-tight font-semibold tracking-[-1px] text-[#243d33] sm:text-4xl lg:text-[46px]">
              Semua rencana.
              <br />
              <em className="font-editorial italic">Satu tempat bertemu.</em>
            </h2>
          </div>

          <Link
            href="/workspace/demo"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#243d33] transition-colors hover:text-[hsl(32_90%_36%)]"
          >
            <span>Jelajahi workspace interaktif</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <Link
            href="/workspace/demo/ceremonies"
            className="group relative flex flex-col justify-between border border-[#d5d9ca] bg-[#fffdf6] p-6 transition-all hover:bg-[#e9e9dc]"
          >
            <div>
              <div className="mb-6 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#e4c874] text-xs font-bold text-[#263f32]">
                01
              </div>
              <h3 className="font-editorial text-2xl leading-tight font-semibold text-[#243d33]">
                Upacara
                <br />
                &amp; banten
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
                Susun tahapan, kebutuhan, dan kesiapan sarana upakara sesuai
                tradisi.
              </p>
            </div>
            <div className="mt-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#e9e9dc] text-[#243d33] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/workspace/demo/tasks"
            className="group relative flex flex-col justify-between border border-[#d5d9ca] bg-[#fffdf6] p-6 transition-all hover:bg-[#e9e9dc]"
          >
            <div>
              <div className="mb-6 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#e4c874] text-xs font-bold text-[#263f32]">
                02
              </div>
              <h3 className="font-editorial text-2xl leading-tight font-semibold text-[#243d33]">
                Tugas
                <br />
                &amp; keluarga
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
                Jelas pembagiannya. Terlihat perkembangannya bersama seluruh
                panitia.
              </p>
            </div>
            <div className="mt-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#e9e9dc] text-[#243d33] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/workspace/demo/budget"
            className="group relative flex flex-col justify-between border border-[#d5d9ca] bg-[#fffdf6] p-6 transition-all hover:bg-[#e9e9dc]"
          >
            <div>
              <div className="mb-6 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#e4c874] text-xs font-bold text-[#263f32]">
                03
              </div>
              <h3 className="font-editorial text-2xl leading-tight font-semibold text-[#243d33]">
                Anggaran
                <br />
                &amp; vendor
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
                Rencana biaya, komitmen, dan pembayaran yang tercatat
                transparan.
              </p>
            </div>
            <div className="mt-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#e9e9dc] text-[#243d33] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Card 4 */}
          <Link
            href="/workspace/demo/rundown"
            className="group relative flex flex-col justify-between border border-[#d5d9ca] bg-[#fffdf6] p-6 transition-all hover:bg-[#e9e9dc]"
          >
            <div>
              <div className="mb-6 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#e4c874] text-xs font-bold text-[#263f32]">
                04
              </div>
              <h3 className="font-editorial text-2xl leading-tight font-semibold text-[#243d33]">
                Tamu
                <br />
                &amp; rundown
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
                Dari daftar undangan keluarga hingga urutan jam-demi-jam hari-H.
              </p>
            </div>
            <div className="mt-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#e9e9dc] text-[#243d33] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Story / How-It-Works & Principles Section */}
      <section
        className="border-t border-[#d5d9ca] bg-[#f5f2e7] py-20"
        id="how-it-works"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="principles">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left Steps */}
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-[#5e6c60] uppercase">
                BERSAMA, DARI AWAL
              </p>
              <h2 className="font-editorial mt-2 text-3xl leading-tight font-semibold tracking-[-1px] text-[#243d33] sm:text-4xl lg:text-[46px]">
                Ritual penuh makna.
                <br />
                <em className="font-editorial italic">
                  Persiapan lebih tertata.
                </em>
              </h2>
              <p className="mt-3 text-xs text-[#5e6c60]">
                Cara Kerja Perencanaan di Patemon
              </p>

              <ol className="mt-10 space-y-7">
                <li className="flex items-start gap-5">
                  <span className="font-editorial text-2xl font-semibold text-[#e4c874]">
                    01
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#243d33]">
                      Daftar & Buat Workspace: Satu ruang untuk pawiwahan
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#5e6c60]">
                      Mulai dari nama pasangan, tanggal hari baik (dewasa ayu),
                      serta pemilihan bentuk adat (Memadik, Ngerorod, Nyeburin).
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-5">
                  <span className="font-editorial text-2xl font-semibold text-[#e4c874]">
                    02
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#243d33]">
                      Eksplorasi Katalog & Draft: Libatkan keluarga
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#5e6c60]">
                      Undang keluarga besar dengan hak akses pemilik, editor,
                      atau pelihat; tinjau sarana banten bersama serati
                      setempat.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-5">
                  <span className="font-editorial text-2xl font-semibold text-[#e4c874]">
                    03
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#243d33]">
                      Aktivasi Lisensi Sekali Bayar: Pantau kesiapan bersama
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#5e6c60]">
                      Aktifkan lisensi sekali bayar Rp 199.000 untuk kolaborasi
                      penuh tanpa batasan waktu dan tanpa langganan berulang.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-5">
                  <span className="font-editorial text-2xl font-semibold text-[#e4c874]">
                    04
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#243d33]">
                      Kolaborasi & Kawal Hari-H
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#5e6c60]">
                      Pantau pos pengeluaran, konfirmasi kehadiran tamu, bagikan
                      rundown acara WITA, dan cetak lembar kontingensi offline.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Right Photo with Framing & Stamp */}
            <div className="relative mx-auto max-w-[420px] pr-6 pb-6 lg:mx-0 lg:max-w-none">
              <div
                className="absolute inset-y-0 right-0 left-6 -z-10 translate-y-6 border border-[#c0a75e]"
                aria-hidden="true"
              />
              <div className="relative h-[380px] w-full overflow-hidden shadow-xl sm:h-[450px]">
                <Image
                  src="/images/landing/celebration.jpg"
                  alt="Pasangan merayakan pernikahan dengan penuh kebahagiaan"
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover"
                />
              </div>

              {/* Rotating Gold Stamp */}
              <div
                className="absolute -bottom-4 -left-4 flex h-[110px] w-[110px] -rotate-12 items-center justify-center rounded-full bg-[#e4c874] p-2 text-center text-[9px] font-bold tracking-[1.5px] text-[#233f36] shadow-lg sm:h-[120px] sm:w-[120px] sm:text-[10px]"
                aria-hidden="true"
              >
                <span>
                  DIRENCANAKAN
                  <br />
                  DENGAN HATI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (Forest Dark with Gold Price Card) */}
      <section className="bg-[#233f36] py-24 text-[#fcf8e9]" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-[#e4c874] uppercase">
                SATU PAWIWAHAN. SATU RUANG BERSAMA.
              </p>
              <h2 className="font-editorial mt-2 text-3xl leading-tight font-semibold tracking-[-1px] text-white sm:text-4xl lg:text-[46px]">
                Rencana lebih tertata.
                <br />
                <em className="font-editorial text-[#e4c874] italic">
                  Tanpa biaya bulanan.
                </em>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#c9d3c7]">
                Mulai dengan demo interaktif, lalu aktifkan ruang privat untuk
                rencana pawiwahan dan keluarga kalian. Cukup sekali bayar seumur
                hidup untuk setiap pernikahan.
              </p>
            </div>

            {/* Price Card */}
            <div className="mx-auto w-full max-w-md rounded-2xl border border-[#d5d9ca]/20 bg-[#f9f6e9] p-8 text-[#243d33] shadow-2xl sm:p-9">
              <div className="text-xs font-semibold tracking-wider text-[#5e6c60] uppercase">
                Paket Pawiwahan
              </div>
              <div className="font-editorial mt-3 text-4xl font-bold tracking-tight text-[#233f36]">
                Rp 199.000
              </div>
              <p className="mt-1 text-xs text-[#5e6c60]">
                Sekali bayar per workspace (tanpa langganan)
              </p>

              <ul className="mt-6 space-y-3 border-t border-[#d5d9ca] pt-6 text-xs text-[#243d33]">
                <li className="flex items-center gap-2.5">
                  <span className="text-base text-[#e4c874]">✓</span>
                  <span>1 ruang pawiwahan privat</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base text-[#e4c874]">✓</span>
                  <span>Hingga 15 anggota keluarga</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base text-[#e4c874]">✓</span>
                  <span>Upacara, banten, tugas &amp; anggaran</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base text-[#e4c874]">✓</span>
                  <span>Vendor, tamu &amp; rundown</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-base text-[#e4c874]">✓</span>
                  <span>Ekspor data CSV / JSON &amp; berkas cetak</span>
                </li>
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e4c874] py-3 text-center text-xs font-semibold text-[#233f36] shadow transition-all hover:brightness-105"
                >
                  <span>Mulai Rencanakan Sekarang</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/pricing"
                  className="text-center text-[11px] font-medium text-[#5e6c60] hover:text-[#233f36]"
                >
                  Lihat detail perbandingan lisensi →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section
        className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8"
        id="faq"
      >
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.15em] text-[#5e6c60] uppercase">
            PERTANYAAN UMUM
          </p>
          <h2 className="font-editorial mt-2 text-3xl font-semibold tracking-[-0.8px] text-[#243d33] sm:text-4xl">
            Sebelum mulai merencanakan.
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          <details className="group rounded-xl border border-[#d5d9ca] bg-[#fffdf6] p-5 transition-colors open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#243d33]">
              <span>Bisa mencoba sebelum membeli?</span>
              <span className="text-xs text-[#5e6c60] transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
              Bisa. Tombol demo membuka contoh workspace dengan data ilustrasi.
              Coba menandai tugas, menelusuri modul, atau mencari tamu tanpa
              membuat akun.
            </p>
          </details>

          <details className="group rounded-xl border border-[#d5d9ca] bg-[#fffdf6] p-5 transition-colors open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#243d33]">
              <span>Apakah keluarga bisa ikut membantu?</span>
              <span className="text-xs text-[#5e6c60] transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
              Workspace mendukung hingga 15 anggota keluarga, dengan peran
              pemilik, editor, dan viewer (pelihat). Peran menentukan siapa yang
              bisa mengatur, mengedit, atau melihat rencana.
            </p>
          </details>

          <details className="group rounded-xl border border-[#d5d9ca] bg-[#fffdf6] p-5 transition-colors open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#243d33]">
              <span>Apakah semua rangkaian upacara harus sama?</span>
              <span className="text-xs text-[#5e6c60] transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
              Tidak. Rencana upacara dapat disesuaikan dengan tradisi dan
              kesepakatan keluarga (desa, kala, patra). Isi demo merupakan
              contoh dan referensi awal, bukan pedoman baku yang kaku.
            </p>
          </details>

          <details className="group rounded-xl border border-[#d5d9ca] bg-[#fffdf6] p-5 transition-colors open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#243d33]">
              <span>Apakah Patemon menyediakan jasa wedding organizer?</span>
              <span className="text-xs text-[#5e6c60] transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-[#5e6c60]">
              Patemon adalah platform mandiri untuk mencatat dan mengelola
              persiapan. Keluarga dan pasangan tetap memilih vendor, membuat
              kesepakatan, dan menjalankan acara.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
