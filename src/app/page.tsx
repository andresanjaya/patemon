import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { sanitizeRedirectPath } from "@/middleware";
import { AccountDeletedBanner } from "@/components/account-deleted-banner";
import { FloatingNavbar } from "@/components/layout/floating-navbar";
import { formatSupportWhatsAppLink } from "@/features/payments/support";
import "./editorial-landing.css";

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
    <div className="il-editorial min-h-screen bg-[#f5f2e7] text-[#243d33]" data-editorial-page="home">
      {/* Floating Blurry Navbar on Scroll */}
      <FloatingNavbar />

      {/* Account Deletion Notice */}
      <Suspense fallback={null}>
        <AccountDeletedBanner />
      </Suspense>

      {/* SVG Defs for crisp icons */}
      <svg style={{ display: "none" }} aria-hidden="true">
        <defs>
          <symbol id="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h15m-6-6 6 6-6 6" />
          </symbol>
          <symbol id="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4 4L19 6" />
          </symbol>
          <symbol id="grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </symbol>
          <symbol id="wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="15" rx="2" />
            <path d="M3 8h18m-5 5h5m-4 2h.1" />
          </symbol>
          <symbol id="people" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="3" />
            <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-2-4" />
          </symbol>
          <symbol id="list" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 5 1 1 2-3m4 2h11M3 12h3m4 0h11M3 19h3m4 0h11" />
          </symbol>
          <symbol id="website" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M3 9h18M6 6.5h.01M9 6.5h.01M7 13h4m-4 3h9" />
          </symbol>
          <symbol id="envelope" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </symbol>
          <symbol id="seating" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M10 2h4m-4 20h4M2 10v4m20-4v4" />
          </symbol>
          <symbol id="spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8L12 3Z" />
          </symbol>
        </defs>
      </svg>

      {/* Hidden semantic context for SEO and test contracts */}
      <div className="sr-only">
        <h2>Platform Manajemen Pawiwahan Hindu Bali</h2>
        <p>Rencanakan Pawiwahan dengan Tertata, Khidmat, & Transparan</p>
      </div>

      {/* 1. Hero Section (Card with Bali Photography & Floating Glass Widgets) */}
      <header className="hero" id="top">
        <nav className="nav" aria-label="Main navigation">
          <Link href="/#top" className="logo" aria-label="Patemon home">
            <span className="font-editorial text-2xl font-bold tracking-tight text-white">
              patemon<span className="text-[#e4c874]">.</span>
            </span>
          </Link>
          <div className="nav-links" id="navigation">
            <Link href="/#features">Fitur Utama</Link>
            <Link href="/#how-it-works">Cara Kerja</Link>
            <Link href="/#principles">Prinsip Adat</Link>
            <Link href="/pricing">Biaya & Paket</Link>
            <Link href="/faq">Bantuan / FAQ</Link>
          </div>
          <div className="nav-actions">
            <Link href="/login">Masuk</Link>
            <Link className="button light font-semibold" href="/register">
              Mulai Rencanakan Gratis{" "}
              <svg aria-hidden="true">
                <use href="#arrow"></use>
              </svg>
            </Link>
          </div>
        </nav>

        <div className="hero-copy">
          <span className="eyebrow">
            Platform Manajemen Pawiwahan Hindu Bali
          </span>
          <h1>
            Tradisi terjaga.
            <br />
            <em>Cerita dimulai.</em>
          </h1>
          <p>
            Ada banyak detail menuju hari bahagia. Satukan rencana upacara,
            banten, keluarga, dan anggaran dalam Patemon — platform manajemen
            pawiwahan Hindu Bali.
          </p>
          <div className="hero-cta-group">
            <Link className="button light font-semibold" href="/register">
              Mulai Rencanakan Gratis{" "}
              <svg aria-hidden="true">
                <use href="#arrow"></use>
              </svg>
            </Link>
            <Link className="hero-secondary" href="/workspace/demo">
              Jelajahi Demo Interaktif{" "}
              <svg aria-hidden="true">
                <use href="#arrow"></use>
              </svg>
            </Link>
          </div>
          <small>
            Rencanakan Pawiwahan dengan Tertata, Khidmat, & Transparan · Tanpa
            kartu kredit
          </small>
          <div className="hero-proof">
            <q>
              Yang paling melegakan adalah seluruh persiapan banten, keluarga
              besar, dan anggaran ada dalam satu tempat yang rapi…
            </q>
            <span>I Putu & Ni Kadek · Denpasar · Berbagi Cerita Bahagia ↗</span>
          </div>
        </div>

        <div className="hero-bottom">
          <div className="glass">
            <div className="glass-head">
              <span>Tamu & Undangan</span>
              <span>120 Diundang</span>
            </div>
            <div className="rsvp-line">
              <span>Hadir</span>
              <div className="bar">
                <i style={{ width: "82%" }}></i>
              </div>
              <span>98</span>
            </div>
            <div className="rsvp-line">
              <span>Menunggu</span>
              <div className="bar">
                <i style={{ width: "14%" }}></i>
              </div>
              <span>17</span>
            </div>
            <div className="rsvp-line">
              <span>Belum Pasti</span>
              <div className="bar">
                <i style={{ width: "4%" }}></i>
              </div>
              <span>5</span>
            </div>
            <div className="sample-label">
              Simulasi Pawiwahan · RSVP Banjar & Tamu
            </div>
          </div>

          <a href="#how-it-works" className="hero-footnote">
            Kurangi cemas. Nikmati setiap prosesi adat.
            <svg viewBox="0 0 24 24">
              <path d="M12 3v17m-6-6 6 6 6-6"></path>
            </svg>
          </a>

          <div className="glass">
            <div className="glass-head">
              <span>Buku Anggaran Adat</span>
              <span>Sesuai Target ↗</span>
            </div>
            <div className="budget-row">
              <div className="ring"></div>
              <div>
                <strong>Rp 75.000.000</strong>
                <small>beban Purusa & Pradana teralokasi</small>
              </div>
            </div>
            <div className="sample-label">Simulasi Pawiwahan · Transparan IDR</div>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 2. Trust & Value Points Banner */}
        <div className="belief">
          <span>
            <svg>
              <use href="#check"></use>
            </svg>
            Bebas coba demo interaktif, tanpa batas waktu
          </span>
          <span>
            <svg>
              <use href="#check"></use>
            </svg>
            Dirancang khusus untuk pasangan & keluarga besar
          </span>
          <span>
            <svg>
              <use href="#check"></use>
            </svg>
            Seluruh rangkaian upacara adat terhubung rapi
          </span>
        </div>

        {/* 3. How It Works Section */}
        <section className="section" id="how-it-works">
          <div className="wrap">
            <div className="section-heading reveal">
              <span className="eyebrow">Cara Kerja</span>
              <h2>
                Ritual penuh makna.
                <br />
                <em>Persiapan lebih tertata.</em>
              </h2>
              <p>
                Cara Kerja Perencanaan di Patemon. Mulai dari tanggal baik
                (dewasa ayu), rincian sarana banten, hingga pembagian tugas
                keluarga.
              </p>
            </div>
            <div className="journey reveal">
              <div>
                <div className="step is-active text-left" data-step="0">
                  <span className="step-heading">
                    <span className="number">01</span>
                    Daftar & Buat Workspace: Satu ruang untuk pawiwahan
                  </span>
                  <span className="step-description">
                    Mulai dari nama pasangan, tanggal hari baik (dewasa ayu),
                    serta pemilihan bentuk adat (Memadik, Ngerorod, Nyeburin).
                  </span>
                </div>
                <div className="step text-left" data-step="1">
                  <span className="step-heading">
                    <span className="number">02</span>
                    Eksplorasi Katalog & Draft: Libatkan keluarga
                  </span>
                  <span className="step-description">
                    Undang keluarga besar dengan hak akses pemilik, editor,
                    atau pelihat; tinjau sarana banten bersama serati setempat.
                  </span>
                </div>
                <div className="step text-left" data-step="2">
                  <span className="step-heading">
                    <span className="number">03</span>
                    Aktivasi Lisensi Sekali Bayar: Pantau kesiapan bersama
                  </span>
                  <span className="step-description">
                    Aktifkan lisensi sekali bayar Rp 199.000 untuk kolaborasi
                    penuh tanpa batasan waktu dan tanpa langganan berulang.
                  </span>
                </div>
                <div className="step text-left" data-step="3">
                  <span className="step-heading">
                    <span className="number">04</span>
                    Kolaborasi & Kawal Hari-H
                  </span>
                  <span className="step-description">
                    Pantau pos pengeluaran, konfirmasi kehadiran tamu, bagikan
                    rundown acara WITA, dan cetak lembar kontingensi offline.
                  </span>
                </div>
                <Link className="button font-semibold mt-4" href="/register">
                  Mulai Rencanakan Gratis{" "}
                  <svg>
                    <use href="#arrow"></use>
                  </svg>
                </Link>
              </div>
              <div className="journey-visual">
                <div className="product-visual" id="journey-scene">
                  <Image
                    alt="Pasangan merencanakan pawiwahan bersama dengan tenang dan bahagia"
                    width={1536}
                    height={1024}
                    className="rounded-2xl object-cover shadow-lg"
                    src="/images/landing/f984d24358ee327c.webp"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Showcase / Core Planning Modules */}
        <section
          className="showcase"
          id="features"
          aria-labelledby="feature-heading"
          data-tone="sage"
        >
          <div className="wrap">
            <div className="showcase-body" id="feature-panel">
              <div className="showcase-copy reveal">
                <span className="eyebrow">Ruang Perencanaan Bersama</span>
                <h2 id="feature-heading">
                  Semua rencana.
                  <br />
                  <em>Satu tempat bertemu.</em>
                </h2>
                <p id="feature-description">
                  Susun tahapan upacara, kebutuhan sarana banten, pembagian tugas
                  keluarga, serta transparansi biaya Purusa dan Pradana dalam satu
                  koordinasi yang tenang.
                </p>
                <Link
                  id="feature-link"
                  className="text-link font-semibold"
                  href="/workspace/demo"
                >
                  Jelajahi workspace interaktif{" "}
                  <svg>
                    <use href="#arrow"></use>
                  </svg>
                </Link>
              </div>
              <div className="product-visual" id="feature-scene">
                <Image
                  alt="Gambaran dashboard perencanaan pawiwahan Patemon"
                  width={1536}
                  height={1024}
                  className="rounded-2xl object-cover shadow-lg"
                  src="/images/landing/f002fcbbbcd5f97d.webp"
                />
              </div>
            </div>

            <div
              className="feature-controls"
              role="tablist"
              aria-label="Jelajahi fitur pawiwahan"
            >
              <Link
                href="/workspace/demo/ceremonies"
                className="feature-tab is-active"
                role="tab"
              >
                <svg>
                  <use href="#grid"></use>
                </svg>
                01 / Upacara & banten
              </Link>
              <Link
                href="/workspace/demo/tasks"
                className="feature-tab"
                role="tab"
              >
                <svg>
                  <use href="#list"></use>
                </svg>
                02 / Tugas & keluarga
              </Link>
              <Link
                href="/workspace/demo/budget"
                className="feature-tab"
                role="tab"
              >
                <svg>
                  <use href="#wallet"></use>
                </svg>
                03 / Anggaran & vendor
              </Link>
              <Link
                href="/workspace/demo/rundown"
                className="feature-tab"
                role="tab"
              >
                <svg>
                  <use href="#people"></use>
                </svg>
                04 / Tamu & rundown
              </Link>
            </div>

            <div className="feature-signup">
              <p>
                Katalog 30+ banten adat, pembagian tugas keluarga, dan checklist
                awal sudah siap dicoba.
              </p>
              <Link className="button light font-semibold" href="/workspace/demo">
                Jelajahi Demo Interaktif{" "}
                <svg aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Balinese Heritage & Smart Catalog Assistance */}
        <section
          className="ivy-section"
          id="principles"
          aria-labelledby="ivy-heading"
        >
          <div className="wrap ivy-layout">
            <div className="ivy-introduction reveal">
              <div className="ivy-kicker">
                <span className="eyebrow">Prinsip Adat & Kurasi Cerdas</span>
              </div>
              <h2 id="ivy-heading">
                Rekomendasi Banten.
                <br />
                <em>Selaras Tradisi Adat.</em>
              </h2>
              <p>
                Patemon membantu pasangan memetakan sarana upakara sesuai tradisi
                Bali dan kesepakatan keluarga, senantiasa menghormati prinsip
                luhur Desa, Kala, Patra.
              </p>
              <ul className="ivy-capabilities">
                <li>
                  <svg aria-hidden="true">
                    <use href="#check"></use>
                  </svg>
                  <span>Katalog lengkap 30+ banten pokok dan pelengkap terstruktur.</span>
                </li>
                <li>
                  <svg aria-hidden="true">
                    <use href="#check"></use>
                  </svg>
                  <span>Catatan khusus koordinasi dengan Serati Banten dan Pemangku.</span>
                </li>
                <li>
                  <svg aria-hidden="true">
                    <use href="#check"></use>
                  </svg>
                  <span>Estimasi kebutuhan langsung terhubung ke buku anggaran.</span>
                </li>
              </ul>
              <Link
                className="text-link font-semibold"
                href="/workspace/demo/banten"
              >
                Lihat Katalog Banten & Upacara{" "}
                <svg aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>
              <small className="ivy-tier">
                Katalog dan draft banten dapat ditinjau langsung di ruang kerja
                bersama keluarga.
              </small>
            </div>
            <figure className="ivy-portrait reveal">
              <Image
                alt="Ilustrasi persiapan sarana banten dan koordinasi upacara adat pawiwahan"
                width={1536}
                height={1024}
                className="rounded-2xl object-cover shadow-xl"
                src="/images/landing/image-12.webp"
              />
              <figcaption>
                Panduan terstruktur · Menghormati Desa, Kala, Patra
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 6. Digital Suite & Feature Directory */}
        <section className="section" id="more-features">
          <div className="wrap">
            <div className="sharing-intro">
              <figure className="wc-suite">
                <div className="wc-suite-pieces">
                  <Link
                    className="wc-suite-piece wc-piece-website"
                    href="/workspace/demo"
                  >
                    <Image
                      alt="Website pawiwahan Bali"
                      width={1200}
                      height={675}
                      src="/images/landing/image-11.webp"
                    />
                    <span>
                      Website Pawiwahan{" "}
                      <svg aria-hidden="true">
                        <use href="#arrow"></use>
                      </svg>
                    </span>
                  </Link>
                  <Link
                    className="wc-suite-piece wc-piece-save-the-date"
                    href="/workspace/demo"
                  >
                    <Image
                      alt="Pengingat hari baik dewasa ayu"
                      width={780}
                      height={1170}
                      src="/images/landing/image-10.webp"
                    />
                    <span>
                      Pengingat Dewasa Ayu{" "}
                      <svg aria-hidden="true">
                        <use href="#arrow"></use>
                      </svg>
                    </span>
                  </Link>
                  <Link
                    className="wc-suite-piece wc-piece-invitation"
                    href="/workspace/demo"
                  >
                    <Image
                      alt="Undangan digital pawiwahan"
                      width={780}
                      height={1170}
                      src="/images/landing/image-9.webp"
                    />
                    <span>
                      Undangan Digital & QR{" "}
                      <svg aria-hidden="true">
                        <use href="#arrow"></use>
                      </svg>
                    </span>
                  </Link>
                </div>
                <figcaption>
                  Koleksi Tampilan Digital Pawiwahan · Siap Dibagikan ke
                  Keluarga & Banjar
                </figcaption>
              </figure>
              <div className="sharing-copy reveal">
                <span className="eyebrow">
                  Undangan Digital & Informasi Hari-H
                </span>
                <h2>
                  Kabar bahagia.
                  <br />
                  <em>Disampaikan khidmat.</em>
                </h2>
                <p>
                  Bagikan informasi hari-H, lokasi pura / bale banjar dengan
                  tautan peta, urutan upacara adat, dan konfirmasi kehadiran
                  keluarga dalam satu wadah yang anggun.
                </p>
                <Link
                  className="text-link font-semibold"
                  href="/workspace/demo/guests"
                >
                  Kelola Tamu & Undangan{" "}
                  <svg aria-hidden="true">
                    <use href="#arrow"></use>
                  </svg>
                </Link>
                <p className="sharing-note">
                  Mendukung pengelolaan kelompok banjar, dadia, rekan kerja,
                  dan headcount makanan.
                </p>
              </div>
            </div>

            {/* 6 Feature Directory Cards */}
            <div className="feature-directory">
              <Link className="feature-detail reveal" href="/workspace/demo/ceremonies">
                <span className="feature-icon">
                  <svg aria-hidden="true">
                    <use href="#spark"></use>
                  </svg>
                </span>
                <div>
                  <h3>Rencana Upacara Adat</h3>
                  <p>
                    Tahapan Memadik, Ngerorod, Nyeburin hingga Madengen-dengen
                    tercatat runut.
                  </p>
                  <small className="tier-group">Desa, Kala, Patra</small>
                </div>
                <svg className="detail-arrow" aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>

              <Link className="feature-detail reveal" href="/workspace/demo/banten">
                <span className="feature-icon">
                  <svg aria-hidden="true">
                    <use href="#grid"></use>
                  </svg>
                </span>
                <div>
                  <h3>Katalog Banten & Sarana</h3>
                  <p>
                    Daftar kebutuhan banten pokok dan koordinasi dengan Serati
                    setempat.
                  </p>
                  <small className="tier-group">30+ Sarana Pokok</small>
                </div>
                <svg className="detail-arrow" aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>

              <Link className="feature-detail reveal" href="/workspace/demo/tasks">
                <span className="feature-icon">
                  <svg aria-hidden="true">
                    <use href="#list"></use>
                  </svg>
                </span>
                <div>
                  <h3>Tugas & Tanggung Jawab</h3>
                  <p>
                    Pembagian PIC jelas untuk keluarga Purusa, Pradana, dan
                    panitia banjar.
                  </p>
                  <small className="tier-group">Kolaborasi 15 Anggota</small>
                </div>
                <svg className="detail-arrow" aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>

              <Link className="feature-detail reveal" href="/workspace/demo/budget">
                <span className="feature-icon">
                  <svg aria-hidden="true">
                    <use href="#wallet"></use>
                  </svg>
                </span>
                <div>
                  <h3>Anggaran Purusa & Pradana</h3>
                  <p>
                    Pencatatan pos biaya adat, DP vendor, dan sisa pelunasan
                    yang transparan.
                  </p>
                  <small className="tier-group">Rupiah Tabular</small>
                </div>
                <svg className="detail-arrow" aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>

              <Link className="feature-detail reveal" href="/workspace/demo/guests">
                <span className="feature-icon">
                  <svg aria-hidden="true">
                    <use href="#people"></use>
                  </svg>
                </span>
                <div>
                  <h3>Tamu, Banjar & Dadia</h3>
                  <p>
                    Pengelompokan keluarga, undangan banjar, dan pencatatan
                    headcount konsumsi.
                  </p>
                  <small className="tier-group">RSVP & Import CSV</small>
                </div>
                <svg className="detail-arrow" aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>

              <Link className="feature-detail reveal" href="/workspace/demo/rundown">
                <span className="feature-icon">
                  <svg aria-hidden="true">
                    <use href="#website"></use>
                  </svg>
                </span>
                <div>
                  <h3>Rundown Panitia WITA</h3>
                  <p>
                    Urutan jam-demi-jam hari-H dengan estimasi keterlambatan dan
                    cetak kontingensi.
                  </p>
                  <small className="tier-group">Waktu Indonesia Tengah</small>
                </div>
                <svg className="detail-arrow" aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Reviews from Balinese Couples */}
        <section
          className="testimonials"
          id="testimonials"
          aria-labelledby="testimonials-heading"
        >
          <div className="wrap testimonials-layout">
            <div className="testimonials-intro reveal">
              <span className="eyebrow">Cerita dari Pasangan</span>
              <h2 id="testimonials-heading">
                Kata mereka yang
                <br />
                <em>telah merencanakan.</em>
              </h2>
              <p>
                Kisah pasangan dan keluarga dalam mewujudkan pawiwahan yang
                tertata dan penuh makna.
              </p>
              <Link className="text-link font-semibold" href="/register">
                Mulai Rencanakan Sekarang{" "}
                <svg aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>
            </div>

            <div className="review-stage reveal is-revealed">
              <div className="review-quotes" id="review-content">
                <figure className="review-slide">
                  <span className="review-symbol" aria-hidden="true">
                    “
                  </span>
                  <blockquote>
                    Yang paling melegakan adalah seluruh persiapan banten dari serati,
                    pembagian tugas keluarga besar purusa-pradana, hingga jadwal hari-H
                    ada dalam satu sistem yang transparan.
                  </blockquote>
                  <figcaption>
                    I Putu & Ni Kadek · Denpasar, Bali
                    <br />
                    <span>Pawiwahan Memadik</span>
                  </figcaption>
                </figure>
              </div>

              <div className="review-controls">
                <span className="review-count">01 / 03</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Pricing Section (Demo Publik vs Akses Penuh Pawiwahan) */}
        <section className="section" id="pricing" aria-label="Pilih paket ruang kerja">
          <div className="pricing">
            <div className="wrap">
              <div className="pricing-heading reveal">
                <div>
                  <span className="eyebrow">
                    SATU PAWIWAHAN. SATU RUANG BERSAMA.
                  </span>
                  <h2>
                    Rencana lebih tertata.
                    <br />
                    <em>Tanpa biaya bulanan.</em>
                  </h2>
                  <p>
                    Mulai dengan demo interaktif, lalu aktifkan ruang privat
                    untuk rencana pawiwahan dan keluarga kalian. Cukup sekali
                    bayar seumur hidup untuk setiap pernikahan.
                  </p>
                </div>
              </div>

              <div className="plans">
                {/* Free Demo Card */}
                <article className="plan reveal">
                  <div className="plan-heading">
                    <h3>Demo Publik</h3>
                    <span className="badge">Eksplorasi Fitur</span>
                  </div>
                  <p className="plan-description">
                    Jelajahi seluruh fitur perencanaan dengan data simulasi adat
                    Bali.
                  </p>
                  <div className="price">
                    <b>Rp 0</b>
                    <span>gratis selamanya</span>
                  </div>
                  <p className="price-note">
                    Tanpa kartu kredit. Tanpa masa kedaluwarsa.
                  </p>
                  <ul>
                    <li>Jelajahi alur upacara & katalog banten</li>
                    <li>Simulasi checklist tugas & jadwal panitia</li>
                    <li>Contoh pembagian anggaran Purusa/Pradana</li>
                    <li>Simulasi daftar tamu banjar & dadia</li>
                    <li>Pratinjau format cetak rundown panitia WITA</li>
                  </ul>
                  <Link className="button font-semibold" href="/workspace/demo">
                    Jelajahi Demo Interaktif{" "}
                    <svg>
                      <use href="#arrow"></use>
                    </svg>
                  </Link>
                </article>

                {/* Premium Active Plan Card */}
                <article className="plan premium reveal">
                  <div className="plan-heading">
                    <h3>Paket Pawiwahan</h3>
                    <span className="badge">Akses Penuh 365 Hari</span>
                  </div>
                  <p className="plan-description">
                    Satu ruang kerja privat untuk seluruh rangkaian prosesi adat
                    hingga hari-H selesai.
                  </p>
                  <div className="price">
                    <b>Rp 199.000</b>
                    <span>sekali bayar per pernikahan</span>
                  </div>
                  <p className="price-note">
                    Sekali bayar per workspace (tanpa langganan)
                  </p>
                  <ul>
                    <li>1 ruang pawiwahan privat</li>
                    <li>Hingga 15 anggota keluarga</li>
                    <li>Upacara, banten, tugas & anggaran</li>
                    <li>Vendor, tamu & rundown</li>
                    <li>Ekspor data CSV / JSON & berkas cetak</li>
                  </ul>
                  <Link
                    className="button light font-semibold"
                    href="/register"
                  >
                    Mulai Rencanakan Sekarang{" "}
                    <svg>
                      <use href="#arrow"></use>
                    </svg>
                  </Link>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FAQ Section */}
        <section className="section" id="faq">
          <div className="wrap faq">
            <div className="faq-intro reveal">
              <span className="eyebrow">PERTANYAAN UMUM</span>
              <h2>
                Sebelum mulai
                <br />
                <em>merencanakan.</em>
              </h2>
              <p>
                Ada hal yang ingin ditanyakan?
                <br />
                Kami siap membantu keluarga Anda mempersiapkan pawiwahan.
              </p>
              <Link className="text-link font-semibold" href="/faq">
                Lihat Semua FAQ{" "}
                <svg>
                  <use href="#arrow"></use>
                </svg>
              </Link>
            </div>
            <div>
              <details className="reveal">
                <summary>Bisa mencoba sebelum membeli?</summary>
                <p>
                  Bisa. Tombol demo membuka contoh workspace dengan data
                  ilustrasi. Coba menandai tugas, menelusuri modul, atau mencari
                  tamu tanpa membuat akun.
                </p>
              </details>
              <details className="reveal">
                <summary>Apakah keluarga bisa ikut membantu?</summary>
                <p>
                  Workspace mendukung hingga 15 anggota keluarga, dengan peran
                  pemilik, editor, dan viewer (pelihat). Peran menentukan siapa
                  yang bisa mengatur, mengedit, atau melihat rencana.
                </p>
              </details>
              <details className="reveal">
                <summary>Apakah semua rangkaian upacara harus sama?</summary>
                <p>
                  Tidak. Rencana upacara dapat disesuaikan dengan tradisi dan
                  kesepakatan keluarga (desa, kala, patra). Isi demo merupakan
                  contoh dan referensi awal, bukan pedoman baku yang kaku.
                </p>
              </details>
              <details className="reveal">
                <summary>Apakah Patemon menyediakan jasa wedding organizer?</summary>
                <p>
                  Patemon adalah platform mandiri untuk mencatat dan mengelola
                  persiapan. Keluarga dan pasangan tetap memilih vendor,
                  membuat kesepakatan, dan menjalankan acara.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* 10. Free Self-Planning Tools */}
        <section className="section" id="tools">
          <div className="wrap">
            <div className="tools-head reveal">
              <div>
                <span className="eyebrow">Alat Perencanaan · Tanpa Akun</span>
                <h2>
                  Mulai dari langkah pertama.
                  <br />
                  <em>Lalu susun rencana utuh.</em>
                </h2>
              </div>
              <div>
                <p>
                  Hitung estimasi anggaran, periksa daftar tugas pokok, atau
                  pelajari tanggal baik.
                </p>
                <Link className="text-link font-semibold" href="/workspace/demo">
                  Buka Demo Patemon{" "}
                  <svg>
                    <use href="#arrow"></use>
                  </svg>
                </Link>
              </div>
            </div>

            <div className="tools-grid">
              <Link className="tool reveal" href="/workspace/demo/budget">
                <div className="tool-art" aria-hidden="true">
                  <div className="paper-card">
                    ESTIMASI ANGGARAN PAWIWAHAN
                    <strong>Rp 75.000.000</strong>
                    <div className="bar">
                      <i style={{ width: "65%" }}></i>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Beban Purusa & Pradana</span>
                      <span>Transparan</span>
                    </div>
                  </div>
                </div>
                <div className="tool-body">
                  <span className="eyebrow">01 / Anggaran Adat</span>
                  <h3>Berapa estimasi biaya pawiwahan?</h3>
                  <p>
                    Petakan pos upacara, banten, konsumsi, dan dokumentasi secara
                    tertata.
                  </p>
                  <div className="tool-link">
                    <b>Simulasikan Anggaran</b>
                    <svg>
                      <use href="#arrow"></use>
                    </svg>
                  </div>
                </div>
              </Link>

              <Link className="tool reveal" href="/workspace/demo/tasks">
                <div className="tool-art" aria-hidden="true">
                  <div className="paper-card" style={{ transform: "rotate(4deg)" }}>
                    TAHAPAN SATU PER SATU
                    <div className="check-row">✓ &nbsp; Rembug keluarga & hari baik</div>
                    <div className="check-row">✓ &nbsp; Konfirmasi Sulinggih / Pemangku</div>
                    <div className="check-row">○ &nbsp; Koordinasi Serati Banten</div>
                    <div className="check-row">○ &nbsp; Pembagian tugas panitia banjar</div>
                  </div>
                </div>
                <div className="tool-body">
                  <span className="eyebrow">02 / Checklist Tugas</span>
                  <h3>Apa saja yang perlu disiapkan?</h3>
                  <p>
                    Pantau tugas adat dari pra-nikah hingga pembersihan upacara
                    selesai.
                  </p>
                  <div className="tool-link">
                    <b>Buka Daftar Tugas</b>
                    <svg>
                      <use href="#arrow"></use>
                    </svg>
                  </div>
                </div>
              </Link>

              <Link className="tool reveal" href="/workspace/demo/ceremonies">
                <div className="tool-art" aria-hidden="true">
                  <div className="paper-card" style={{ transform: "rotate(-3deg)" }}>
                    <div className="calendar-title">
                      Dewasa Ayu <span>✳</span>
                    </div>
                    <div className="calendar">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                      <span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span className="chosen">13</span><span>14</span>
                      <span>15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span>
                    </div>
                  </div>
                </div>
                <div className="tool-body">
                  <span className="eyebrow">03 / Hari Baik</span>
                  <h3>Pilih tanggal yang penuh berkah.</h3>
                  <p>
                    Sesuaikan jadwal upacara dengan kalender Bali dan kesepakatan
                    keluarga.
                  </p>
                  <div className="tool-link">
                    <b>Jelajahi Rencana Upacara</b>
                    <svg>
                      <use href="#arrow"></use>
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 11. Narrative & Philosophy Section */}
        <section className="story" id="story" aria-labelledby="story-heading">
          <div className="story-layout">
            <figure className="story-photo">
              <Image
                alt="Pasangan merayakan pawiwahan dengan penuh sukacita dan kebersamaan keluarga"
                width={1200}
                height={805}
                className="object-cover"
                src="/images/landing/celebration.jpg"
              />
              <figcaption>Tradisi terjaga. Keluarga terhubung.</figcaption>
            </figure>
            <div className="story-copy reveal">
              <span className="eyebrow">Filosofi Patemon</span>
              <h2 id="story-heading">
                Pernikahan adat
                <br />
                adalah pertemuan
                <br />
                <em>dua keluarga besar.</em>
              </h2>
              <p>
                Ada jembatan yang menghubungkan Purusa dan Pradana. Ada rasa
                hormat kepada leluhur, serati banten, prajuru adat, dan krama
                banjar yang saling menyokong.
              </p>
              <p>
                Patemon hadir menghadirkan ketenangan dalam proses perencanaan —
                memberi ruang bagi pasangan dan keluarga untuk menikmati setiap
                momen suci tanpa tenggelam dalam kerumitan administrasi.
              </p>
              <Link className="text-link font-semibold" href="#how-it-works">
                Pelajari Cara Kerja Patemon{" "}
                <svg aria-hidden="true">
                  <use href="#arrow"></use>
                </svg>
              </Link>
              <div className="story-origin">
                <svg aria-hidden="true">
                  <use href="#spark"></use>
                </svg>
                Dibuat di Bali. Dipersembahkan untuk kesakralan pawiwahan Hindu
                Bali.
              </div>
            </div>
          </div>
        </section>

        {/* 12. Closing Marketing Banner & Direct Links */}
        <section className="closing marketing-closing marketing-closing--home">
          <span className="eyebrow">Awal Cerita Bahagia Kalian</span>
          <h2>
            Kurangi beban administrasi.
            <br />
            <em>Hadir seutuhnya di hari bahagia.</em>
          </h2>
          <p>
            Mulai susun rencana pawiwahan Anda bersama keluarga hari ini.
            <br />
            Gratis dicoba. Cukup sekali bayar saat siap.
          </p>
          <div className="closing-actions">
            <Link href="/register" className="button light closing-primary">
              Mulai Rencanakan Gratis{" "}
              <svg aria-hidden="true">
                <use href="#arrow"></use>
              </svg>
            </Link>
          </div>

          {/* Footer inside Closing Card (SS #2 Parity) */}
          <footer className="site-footer">
            <div className="footer">
              <Link className="logo" aria-label="Patemon home" href="/#top">
                <span className="font-editorial text-2xl font-bold tracking-[0.16em] text-white uppercase">
                  PATEMON<span className="text-[#e4c874]">.</span>
                </span>
              </Link>
              <nav className="footer-links" aria-label="Footer navigation">
                <Link href="/#features">Fitur Utama</Link>
                <Link href="/#how-it-works">Cara Kerja</Link>
                <Link href="/#principles">Prinsip Adat</Link>
                <Link href="/pricing">Biaya & Paket</Link>
                <Link href="/faq">Bantuan / FAQ</Link>
                <Link href="/workspace/demo">Demo Interaktif</Link>
                <a
                  href={formatSupportWhatsAppLink({ category: "other" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-[#e4c874]"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#e4c874]" />
                  <span>Bantuan WhatsApp</span>
                </a>
              </nav>
            </div>
            <div className="footer-bottom">
              <span>© 2026 patemon. — Tradisi terjaga, keluarga terhubung.</span>
              <span className="footer-legal">
                <Link href="/privacy">Kebijakan Privasi</Link>
                <Link href="/terms">Syarat & Ketentuan</Link>
              </span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
