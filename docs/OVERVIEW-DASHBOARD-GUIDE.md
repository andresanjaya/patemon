# Overview Dashboard & Readiness Calculations Guide (Issue #32)

This document describes the architecture, calculation models, and user experience of the Balinese Hindu Wedding Overview Dashboard & Readiness Engine (*Pusat Kendali & Kesiapan Pawiwahan*) implemented in Patemon MVP v1.

---

## 1. Overview & Cultural Objectives

Planning a Balinese Hindu wedding requires orchestrating sacred rituals (*yadnya*), family consensus (*rembug keluarga*), spatial coordination across compounds/griyas/puras, and modern event logistics.

The Overview Dashboard serves as the central command cockpit for the couple and family committee (*panitia pawiwahan*):
1. **Countdown & Dewasa Ayu Ticker:** Timezone-aware (WITA, UTC+8) countdown with contextual milestones (H-30, H-7, H-1, Hari-H, and post-ceremony status).
2. **Holistic Readiness Engine (0 - 100%):** A composite readiness calculation model balancing sacred ritual readiness (45%) with logistics, vendor, and budget execution (55%).
3. **Action Center (*Aksi Mendesak & Perlu Perhatian*):** Auto-prioritized triage surfacing overdue tasks, pending urgent items, unassigned banten, and unscheduled ceremonies with 1-click jump links.
4. **Next Upcoming Ceremony Spotlight:** Context card showcasing the immediate next ceremony, days remaining, venue location, PIC, and linked banten/tasks.
5. **Quick Stats Grid:** 6 interconnected planning hubs (Prosesi, Banten, Tugas, Anggaran, Vendor, Tamu) displaying live metrics and progress percentages.

---

## 2. Readiness Calculation Architecture (`calculations.ts`)

### Weighted Composite Readiness Formula

$$\text{Readiness Score} = \sum_{i} (S_i \times W_i)$$

| Dimension | Weight | Criteria & Scoring Method |
|---|---|---|
| **Upakara & Banten** | **25%** | `ready`/`owned` = 100%, `making`/`ordered` = 65%, `needed` = 0%. `not_needed` excluded from denominator. Baseline of 10% if ceremonies are created. |
| **Rangkaian Adat** | **20%** | Scheduled date (+60%) and assigned sacred location (+40%) per ceremony. |
| **Checklist & Tugas** | **20%** | `done` = 100%, `in_progress` = 50%, `todo` = 0%. `canceled` excluded. |
| **Rekanan & Vendor** | **15%** | `completed`/`booked` = 100%, `quoted` = 50%, `contacted` = 25%, `prospect` = 10%. |
| **Anggaran & Biaya** | **10%** | Target budget defined (+30%), items itemized (+30%), paid ratio $\min(1, \frac{\text{paid}}{\text{actual}})$ (+40%). |
| **Susunan Acara (Rundown)** | **10%** | $\ge 8$ agenda segments = 100%, $\ge 5$ segments = 80%, $\ge 3$ segments = 60%, $< 3$ = count $\times$ 20%. |

### Readiness Tiers

- **90% - 100% (`siap_hari_h`):** *Siap Menuju Hari H* — Seluruh persiapan inti telah matang dan siap menyongsong hari suci pawiwahan.
- **70% - 89% (`hampir_matang`):** *Hampir Matang* — Sebagian besar rincian adat, banten, dan teknis telah siap. Lakukan pengecekan akhir.
- **45% - 69% (`sebagian_besar_siap`):** *Sebagian Besar Siap* — Proses berjalan baik. Fokus pada pengadaan sisa sarana upakara dan kepastian vendor.
- **20% - 44% (`dalam_proses`):** *Dalam Proses* — Fondasi adat telah terbentuk. Lanjutkan pembagian tugas keluarga dan kepastian serati.
- **0% - 19% (`persiapan_awal`):** *Persiapan Awal* — Baru memulai perencanaan. Mulai dengan menyusun rangkaian prosesi dan sarana banten.

---

## 3. Countdown & Timezone Normalization

The countdown logic standardizes inputs using midnight UTC timestamps to avoid day-off boundary shifts:
- If `prospectiveDate` is unset: Prompts the couple to consult Dewasa Ayu with Ida Pedanda / Pemangku.
- If $D > 0$: Displays formatted $H-D$ with contextual guidance:
  - $D = 1$: `H-1 (Besok Hari H)`
  - $D \le 7$: `H-D (Pekan Ini)`
  - $D \le 30$: `1 Bulan Menuju Hari H`
- If $D = 0$: `Rahina Pawiwahan (Hari H)`
- If $D < 0$: `Pawiwahan Telah Terlaksana (H+X)`

---

## 4. File Organization

```
src/
├── app/(dashboard)/workspace/[weddingId]/
│   └── page.tsx                         # Workspace Overview (Server Component)
└── features/
    └── overview/
        ├── types.ts                     # Readiness, countdown, urgent action contracts
        ├── calculations.ts              # Mathematical engine, timezone math, and action extraction
        └── components/
            ├── countdown-card.tsx       # Countdown widget with Balinese aesthetic
            ├── readiness-card.tsx       # Radial score & 6-dimension progress bars
            ├── action-center-card.tsx   # Urgent & overdue task triage
            ├── upcoming-ceremony-card.tsx # Next ceremony spotlight card
            └── overview-dashboard.tsx   # High-level coordinator component
```

---

## 5. Automated Tests

Run test suite via:
```bash
pnpm test
```
Tests in `tests/overview-readiness.test.ts` (13 tests) verify:
- Accurate countdown calculations across future, today, past, and null dates.
- Empty, partial, and 100% full readiness score calculations.
- Overdue and urgent action extraction, priority sorting, and 5-item capping.
- Next upcoming ceremony selection with linked resource counts.

