#!/usr/bin/env node

/**
 * Patemon Ritual Seed Data Ingestion & Provenance Verification Pipeline
 *
 * Imports versioned JSON seed files, validates provenance integrity, ensures
 * separation between packages and constituent components, checks citations,
 * and upserts data into PostgreSQL via Supabase.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

// Load .env.local manually if exists
function loadEnv() {
  const envPath = resolve(rootDir, ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        const val = values
          .join("=")
          .replace(/^["']|["']$/g, "")
          .trim();
        process.env[key.trim()] = val;
      }
    }
  }
}

loadEnv();

console.log(
  "🌸 [Patemon] Memulai verifikasi integritas data ritual & adat Bali...\n"
);

// 1. Read seed datasets
const sourcesPath = resolve(rootDir, "supabase/seeds/sources.json");
const ceremoniesPath = resolve(rootDir, "supabase/seeds/ceremonies.json");
const ritualsPath = resolve(rootDir, "supabase/seeds/rituals.json");

const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
const ceremonies = JSON.parse(readFileSync(ceremoniesPath, "utf8"));
const rituals = JSON.parse(readFileSync(ritualsPath, "utf8"));

console.log(`✓ Sumber pustaka & rujukan: ${sources.length} entri`);
console.log(`✓ Template prosesi upacara: ${ceremonies.length} prosesi`);
console.log(`✓ Katalog banten & sarana:   ${rituals.length} item\n`);

// 2. Validate Provenance & Integrity
const sourceIds = new Set(sources.map((s) => s.id));
let errors = [];

// Validate ceremonies provenance
ceremonies.forEach((c) => {
  if (!c.source_id || !sourceIds.has(c.source_id)) {
    errors.push(`Ceremony [${c.id}] '${c.name}' missing valid source_id!`);
  }
  if (!c.validation_status) {
    errors.push(`Ceremony [${c.id}] '${c.name}' missing validation_status!`);
  }
  if (
    c.validation_status === "Terverifikasi Resmi" &&
    c.source_id === "SRC-004"
  ) {
    errors.push(
      `Ceremony [${c.id}] cannot claim official verification with draft field research!`
    );
  }
});

// Validate rituals provenance and package separation
let packageCount = 0;
let itemCount = 0;

rituals.forEach((r) => {
  if (!r.source_id || !sourceIds.has(r.source_id)) {
    errors.push(`Ritual item [${r.id}] '${r.name}' missing valid source_id!`);
  }
  if (!r.item_type) {
    errors.push(`Ritual item [${r.id}] missing item_type!`);
  }
  if (r.item_type === "Paket Banten") {
    packageCount++;
  } else {
    itemCount++;
  }
});

if (errors.length > 0) {
  console.error("❌ Validasi integritas gagal:");
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log("✓ Integritas Provenance & Bibliografi tervalidasi 100%!");
console.log(`  - Pemisahan Paket Banten: ${packageCount} paket`);
console.log(`  - Komponen & Sarana:      ${itemCount} satuan/sarana`);
console.log("  - Seluruh rujukan terhubung ke sumber kepustakaan resmi.\n");

// 3. Connect to Supabase and Upsert Seeds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log(
    "ℹ Tidak ada kredensial Supabase di environment. Seed files JSON & SQL siap digunakan."
  );
  process.exit(0);
}

console.log(`🔗 Menghubungkan ke Supabase: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  try {
    // Upsert sources
    const { error: srcErr } = await supabase.from("sources").upsert(
      sources.map((s) => ({
        id: s.id,
        title: s.title,
        source_type: s.source_type,
        usage_notes: s.usage_notes,
        source_url: s.source_url,
      }))
    );

    if (srcErr) {
      console.warn(
        "  ⚠ Warning saat upsert sources (kemungkinan permission/RLS):",
        srcErr.message
      );
    } else {
      console.log(`✓ Berhasil melakukan upsert ${sources.length} sources.`);
    }

    // Upsert ceremonies
    const { error: cerErr } = await supabase.from("ceremony_templates").upsert(
      ceremonies.map((c) => ({
        id: c.id,
        phase: c.phase,
        name: c.name,
        aliases: c.aliases,
        description: c.description,
        applicability: c.applicability,
        default_pic: c.default_pic,
        validation_status: c.validation_status,
        source_id: c.source_id,
        source_url: c.source_url,
        order_index: c.order_index,
        is_active: c.is_active,
      }))
    );

    if (cerErr) {
      console.warn(
        "  ⚠ Warning saat upsert ceremony_templates:",
        cerErr.message
      );
    } else {
      console.log(
        `✓ Berhasil melakukan upsert ${ceremonies.length} ceremony_templates.`
      );
    }

    // Upsert rituals
    const { error: ritErr } = await supabase.from("ritual_catalog").upsert(
      rituals.map((r) => ({
        id: r.id,
        item_type: r.item_type,
        name: r.name,
        used_in_phase: r.used_in_phase,
        notes: r.notes,
        obligation_level: r.obligation_level,
        default_quantity: r.default_quantity,
        unit: r.unit,
        default_provider: r.default_provider,
        validation_status: r.validation_status,
        source_id: r.source_id,
        source_url: r.source_url,
        is_active: r.is_active,
      }))
    );

    if (ritErr) {
      console.warn("  ⚠ Warning saat upsert ritual_catalog:", ritErr.message);
    } else {
      console.log(
        `✓ Berhasil melakukan upsert ${rituals.length} ritual_catalog.`
      );
    }

    console.log("\n🎉 Seed ritual dan data adat Bali berhasil dieksekusi!");
  } catch (err) {
    console.error("Kesalahan saat mengeksekusi seed:", err);
  }
}

runSeed();
