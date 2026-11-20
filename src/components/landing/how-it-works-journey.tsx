"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

interface StepItem {
  number: string;
  title: string;
  description: string;
  tag: string;
  image: string;
  alt: string;
  badgeHighlight?: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Daftar & Buat Workspace: Satu ruang untuk pawiwahan",
    description:
      "Mulai dari nama pasangan, tanggal hari baik (dewasa ayu), serta pemilihan bentuk adat (Memadik, Ngerorod, Nyeburin).",
    tag: "Langkah 01 · Penentuan Ruang & Dewasa Ayu",
    image: "/images/landing/f984d24358ee327c.webp",
    alt: "Pasangan merencanakan pawiwahan bersama dengan tenang dan bahagia",
    badgeHighlight: "Dewasa Ayu Siap",
  },
  {
    number: "02",
    title: "Eksplorasi Katalog & Draft: Libatkan keluarga",
    description:
      "Undang keluarga besar dengan hak akses pemilik, editor, atau pelihat; tinjau sarana banten bersama serati setempat.",
    tag: "Langkah 02 · Kolaborasi Serati & Keluarga",
    image: "/images/landing/table.jpg",
    alt: "Tinjauan sarana banten dan koordinasi adat bersama keluarga besar",
    badgeHighlight: "Dresta & Serati Terhubung",
  },
  {
    number: "03",
    title: "Aktivasi Lisensi Sekali Bayar: Pantau kesiapan bersama",
    description:
      "Aktifkan lisensi sekali bayar Rp 199.000 untuk kolaborasi penuh tanpa batasan waktu dan tanpa langganan berulang.",
    tag: "Langkah 03 · Akses Penuh Selamanya",
    image: "/images/landing/f002fcbbbcd5f97d.webp",
    alt: "Aktivasi lisensi penuh sekali bayar untuk seluruh anggota keluarga",
    badgeHighlight: "Sekali Bayar · Rp 199.000",
  },
  {
    number: "04",
    title: "Kolaborasi & Kawal Hari-H",
    description:
      "Pantau pos pengeluaran, konfirmasi kehadiran tamu, bagikan rundown acara WITA, dan cetak lembar kontingensi offline.",
    tag: "Langkah 04 · Pelaksanaan Hari-H Khidmat",
    image: "/images/landing/celebration.jpg",
    alt: "Perayaan pawiwahan dengan susunan acara rapi dan penuh kebahagiaan",
    badgeHighlight: "Rundown & Kontingensi Siap",
  },
];

export function HowItWorksJourney() {
  const [activeStep, setActiveStep] = useState(0);
  const current = STEPS[activeStep];

  return (
    <div className="journey reveal">
      {/* Left Column: Interactive Accordion Steps */}
      <div>
        <div className="space-y-1">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                type="button"
                key={step.number}
                onClick={() => setActiveStep(idx)}
                className={`step w-full cursor-pointer rounded-xl border-b border-[#d5d9ca] px-4 py-4.5 text-left transition-all ${
                  isActive
                    ? "is-active bg-[#f0ecde]/70 shadow-2xs"
                    : "hover:bg-[#f2efe4]/50"
                }`}
                aria-expanded={isActive}
              >
                <div className="step-heading flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`number font-mono text-xs font-bold transition-colors ${
                        isActive
                          ? "rounded-full bg-[#e4c874] px-2 py-0.5 text-[#1e382b]"
                          : "text-[#7d8376]"
                      }`}
                    >
                      {step.number}
                    </span>
                    <span
                      className={`text-[15px] transition-colors sm:text-base ${
                        isActive
                          ? "font-semibold text-[#1e382b]"
                          : "text-[#5e6559] hover:text-[#1e382b]"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {isActive && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#e4c874]/30 px-2 py-0.5 text-xs font-semibold text-[#1e382b] sm:inline-flex">
                      <Sparkles className="h-3 w-3 text-[#243d33]" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>

                {isActive && (
                  <p className="step-description animate-in fade-in mt-2.5 max-w-lg pl-9 text-xs leading-relaxed text-[#3f4c40] transition-all duration-200">
                    {step.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4 pl-4">
          <Link className="button light font-semibold" href="/register">
            Mulai Rencanakan Gratis{" "}
            <svg aria-hidden="true" className="ml-1 h-4 w-4">
              <use href="#arrow"></use>
            </svg>
          </Link>
          <span className="text-xs text-[#5e6559]">
            Coba demo langsung tanpa registrasi
          </span>
        </div>
      </div>

      {/* Right Column: Dynamic Visual Device Preview */}
      <div className="journey-visual">
        <div className="product-visual relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-2.5 shadow-xl backdrop-blur-xs transition-all duration-300">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl">
            <Image
              alt={current.alt}
              fill
              sizes="(max-width: 768px) 100vw, 550px"
              className="object-cover transition-opacity duration-300"
              src={current.image}
              priority={activeStep === 0}
            />
            {/* Top Tag Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white shadow-xs backdrop-blur-md">
              <CheckCircle2 className="h-3 w-3 text-[#e4c874]" />
              <span>{current.tag}</span>
            </div>

            {/* Bottom Highlight Pill */}
            {current.badgeHighlight && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-[#1e382b]/90 px-3.5 py-1 text-[11px] font-semibold text-[#e4c874] shadow-md backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-[#e4c874]" />
                <span>{current.badgeHighlight}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
