# Day-of Rundown Planner Guide (Issue #31)

This guide documents the architecture, database schema, data structures, and user experience for the Balinese Hindu Wedding Day-of Rundown Planner (*Susunan Acara / Rundown Hari-H*).

---

## 1. Overview & Cultural Context

Balinese Hindu weddings involve precise spatial and temporal choreography across multi-compound residences and temples. Key events occur at specific times and sacred locations:
- **Pemeriksaan Administrasi & Rias Busana Adat** at *Bale Delod / Ruang Rias*.
- **Upacara Memadik / Mesakapan** at *Bale Dangin / Bale Gede*.
- **Upacara Madengen-dengen** (Spiritual cleansing / *Kala-Hiyang*) at *Natah / Halaman Tengah*.
- **Mewidhi Widhana** (Sacred bond solemnization by Pemangku / Ida Pedanda) at *Pamerajan / Sanggah Kemulan*.
- **Mapejati & Nuur Tirta** (Honoring ancestors and deities) at *Pura Desa / Pura Kahyangan Tiga*.
- **Jamuan Makan & Resepsi Ramah Tamah** (Megibung or banquet reception) at *Wantilan / Area Jamuan*.

To ensure seamless execution, the Rundown Planner provides:
1. **Interactive Visual Timeline View:** Chronological cards with duration badges, location tags, linked ceremonies, and PIC assignments.
2. **Tabular Agenda View:** Clean table format with filter by location and PIC, start/end times, and duration.
3. **Plain Text / WhatsApp & Panitia Sheet:** 1-click clipboard export with formatted ASCII agenda ready to paste into WhatsApp family/committee groups, plus print support.
4. **Starter Template Import:** 1-click import of a canonical 10-step Balinese wedding day rundown.

---

## 2. Database Schema

The feature maps to `public.rundown_events` defined in migration `20261114000001_initial_schema.sql`:

```sql
CREATE TABLE public.rundown_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES public.wedding_workspaces(id) ON DELETE CASCADE,
    ceremony_id UUID REFERENCES public.wedding_ceremonies(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    pic_contact TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Time Representation
`start_time` and `end_time` are stored in standard `HH:MM:SS` or `HH:MM` format (`TIME WITHOUT TIME ZONE`) and rendered in 24-hour format (e.g. `08:00 - 09:30`).

---

## 3. Architecture & File Structure

```
src/
├── app/(dashboard)/workspace/[weddingId]/
│   ├── page.tsx                          # Workspace Overview with Rundown summary widget
│   └── rundown/
│       └── page.tsx                      # Server Component (data fetch, auth, ceremonies)
└── features/
    ├── rundown/
    │   ├── types.ts                      # RundownEvent, stats, and form input contracts
    │   ├── seeds.ts                      # Starter rundown template, locations, duration & text helpers
    │   ├── actions.ts                    # Server Actions: get, create, update, delete, import
    │   └── components/
    │       ├── rundown-dashboard.tsx     # Client dashboard (Timeline, Table, Panitia/Print views)
    │       └── rundown-modal.tsx         # Create / Edit event modal dialog
    └── workspaces/
        └── components/
            └── workspace-header.tsx      # Navigation tab for Rundown
```

---

## 4. Key Utilities & Helpers (`seeds.ts`)

- `calculateDurationMinutes(startTime, endTime)`: Calculates duration accounting for day-of schedules.
- `formatDurationString(minutes)`: Converts minutes to localized strings (e.g. `1j 30m` or `45m`).
- `calculateRundownStats(events)`: Computes total events, scheduled span, unique locations, and assigned PICs.
- `formatRundownPlainText(events, weddingTitle, weddingDate)`: Generates structured, WhatsApp-friendly plain text for panitia and family coordinators.
- `BALINESE_VENUE_LOCATIONS`: Pre-populated sacred and customary spatial zones (*Pamerajan*, *Bale Dangin*, *Natah*, *Wantilan*, etc.).
- `STARTER_RUNDOWN_EVENTS`: Canonical 10-step Balinese wedding itinerary.

---

## 5. Automated Tests

Run test suite via:
```bash
pnpm test
```
Located in `tests/rundown-planner.test.ts` (9 unit tests verifying duration calculation, time formatting, statistics aggregation, plain text panitia output formatting, and starter template data integrity).

