# Ritual Seed Data & Provenance Pipeline

This document outlines the data ingestion, bibliographic provenance, and validation pipeline for Balinese Hindu wedding (*pawiwahan*) ceremonies, banten, and sarana upakara within Patemon.

---

## 1. Principles & Cultural Guardrails (PRD Section 5.2 & Section 10)

1. **Non-Dogmatic / Respect for Local Dresta:**
   - Balinese Hinduism recognizes three levels of custom: *Desa Dresta* (village custom), *Kala Dresta* (time custom), and *Patra Dresta* (contextual custom), alongside *Kula Dresta* (family tradition).
   - Patemon never presents a template as a single universal mandatory procedure. All ceremonial plans are customizable by the family and their *pamangku/sulinggih*.

2. **Transparent Provenance & Citation:**
   - Every ritual process and banten item explicitly links to a valid `source_id` referencing vetted literature or field documentation.
   - Items based on preliminary field research (`SRC-004`) are strictly categorized as `Perlu validasi keluarga/pemangku` and **never** falsely presented as officially verified.

3. **Separation of Packages and Constituent Items:**
   - Banten is split into cohesive packages (`item_type: 'Paket Banten'`, e.g., *Paket Banten Mebyakala Lengkap*) and granular constituent items (`item_type: 'Banten Satuan'` or `'Sarana Upakara'`, e.g., *Daksina*, *Peras*, *Tikeh Dadakan*, *Tegen-tegenan*).
   - Families who order complete packages from a *serati banten* can track the package, while families who prepare items themselves can track individual components.

4. **No Coercive Pricing or Unsafe Quantities:**
   - Fixed prices and mandatory item counts are never hardcoded. Prices are left blank until confirmed by the user or their contracted vendor/serati.

---

## 2. Seed Data Schema & Datasets

Datasets reside in versioned JSON and SQL formats under `supabase/`:

- `supabase/seeds/sources.json`: Bibliographic sources and official institutional citations.
- `supabase/seeds/ceremonies.json`: Canonical sequential wedding process templates.
- `supabase/seeds/rituals.json`: Catalog of banten packages, satuan, and sarana upakara.
- `supabase/seed.sql`: Idempotent SQL script for direct PostgreSQL seeding (`ON CONFLICT (id) DO UPDATE`).

### Bibliographic Sources (`sources`)

| Source ID | Title | Publisher / Author | Type |
| :--- | :--- | :--- | :--- |
| `SRC-001` | *Pedoman Upacara Pawiwahan Umat Hindu* | PHDI Pusat (2002) | Buku Pedoman Resmi Lembaga |
| `SRC-002` | *Tatwa Upakara Pawiwahan Dresta Bali* | Dr. I Made Titib (2008) | Kajian Akademik & Tradisi Adat |
| `SRC-003` | *Himpunan Keputusan Seminar Kesatuan Tafsir* | PHDI Bali (1982-2005) | Keputusan Pasamuhan / Konsensus |
| `SRC-004` | *Dokumentasi Praktik Serati Banten Dresta Badung & Denpasar* | Tim Kurasi Patemon (2026) | Catatan Lapangan Praktisi Adat (Draft) |

---

## 3. Ingestion & Provenance Execution

To execute the automated pipeline and seed the live or staging database:

```bash
# Verify provenance integrity and upsert into Supabase
pnpm seed:rituals
```

The script performs the following validation checks before writing to the database:
1. Verifies that all `source_id` foreign keys exist in `sources.json`.
2. Verifies that no draft research items claim official verification.
3. Enforces separation between package items and constituent components.
4. Performs idempotent upsert into Supabase tables `sources`, `ceremony_templates`, and `ritual_catalog`.

---

## 4. In-Memory Fallbacks

For offline resilience and fast static prerendering, the exact datasets are duplicated in typed TypeScript modules:
- `src/features/ceremonies/seeds.ts`
- `src/features/banten/seeds.ts`

Any failure in database connectivity gracefully falls back to curated in-memory seeds.

---

## 5. Verification Commands

```bash
# Check code formatting
pnpm format:check

# Run linting
pnpm lint

# TypeScript verification
pnpm typecheck

# Automated test suite (including provenance & integrity tests)
pnpm test

# Production build
pnpm build
```
