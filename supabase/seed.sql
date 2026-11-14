-- ==============================================================================
-- Patemon MVP v1 Seed Data
-- Sourced & Curated Balinese Hindu Wedding Ritual Catalog & Ceremony Templates
-- ==============================================================================

-- 1. SOURCES & CITATIONS
INSERT INTO public.sources (id, title, source_type, usage_notes, source_url)
VALUES
  ('SRC-001', 'Pedoman Upacara Pawiwahan Umat Hindu', 'Buku Pedoman Resmi Lembaga Keagamaan', 'Panduan standar pokok upacara pernikahan umat Hindu di Indonesia, tata cara pabyakalaan, dan mesakapan.', 'https://phdi.or.id'),
  ('SRC-002', 'Tatwa Upakara Pawiwahan Dresta Bali', 'Kajian Akademik & Tradisi Adat', 'Penjelasan simbolis banten madengen-dengen, tegen-tegenan, dan variasi upacara dresta Bali Tengah.', 'https://baliloka.id/pustaka/tatwa-pawiwahan'),
  ('SRC-003', 'Himpunan Keputusan Seminar Kesatuan Tafsir Aspek-Aspek Agama Hindu', 'Keputusan Pasamuhan / Konsensus Keagamaan', 'Keputusan seminar resmi mengenai hak waris dan tata perkawinan memadik, ngerorod, serta nyentana.', 'https://phdibali.org/keputusan-seminar'),
  ('SRC-004', 'Dokumentasi Praktik Serati Banten Dresta Badung & Denpasar', 'Catatan Lapangan Praktisi Adat (Draft Riset)', 'Katalog komponen banten dan sarana upakara yang umum dipesan pada serati banten di Bali Selatan.', 'https://github.com/andresanjaya/patemon/blob/main/docs/PRD-MVP-v1.md')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  source_type = EXCLUDED.source_type,
  usage_notes = EXCLUDED.usage_notes,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

-- 2. CEREMONY TEMPLATES
INSERT INTO public.ceremony_templates (id, phase, name, aliases, description, applicability, default_pic, validation_status, source_id, source_url, order_index, is_active)
VALUES
  ('PR-001', 'Persiapan', 'Memadik / Ngidih (Peminangan Resmi)', ARRAY['Ngidih', 'Peminangan', 'Rembug Keluarga'], 'Prosesi pertemuan keluarga pihak pria ke rumah keluarga wanita untuk menyampaikan niat meminang secara adat.', 'Memadik', 'Orang Tua / Tetua Keluarga Purusa', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', 1, TRUE),
  ('PR-002', 'Puncak Acara', 'Mebyakala / Pabyakalaan', ARRAY['Pabyakala', 'Nyapsap', 'Pembersihan Bhuta Kala'], 'Upacara penyucian diri kedua mempelai dari pengaruh bhuta kala sebelum memasuki grahasta asrama.', 'Umum', 'Pemangku / Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', 2, TRUE),
  ('PR-003', 'Puncak Acara', 'Madengen-dengen / Metegen-tegenan', ARRAY['Dengen-dengen', 'Belanja Tradisi Adat', 'Metiwalan'], 'Simbolisasi pembagian peran rumah tangga: tegen-tegenan (tanggung jawab pria) dan suun-suunan (pengelolaan wanita).', 'Umum', 'Keluarga & Saksi Adat', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', 3, TRUE),
  ('PR-004', 'Puncak Acara', 'Mesakapan / Pawiwahan Ring Sanggah Kamulan', ARRAY['Mesakapan', 'Perkawinan Sah Agama & Adat', 'Pesaksi Bhatara Hyang Guru'], 'Penyatuan kedua mempelai di hadapan Hyang Widhi Wasa dan leluhur di Sanggah Kamulan / Merajan keluarga.', 'Umum', 'Ida Pedanda / Pemangku Merajan', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', 4, TRUE),
  ('PR-005', 'Puncak Acara', 'Mejaya-jaya', ARRAY['Panganyaran', 'Pemberkatan Rohani'], 'Pemberkatan rohani oleh Sulinggih/Pemangku agar kedua mempelai mendapatkan kedamaian, kebajikan, dan keturunan suputra.', 'Umum', 'Sulinggih / Pemangku', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', 5, TRUE),
  ('PR-006', 'Puncak Acara', 'Mepegat Pesapat / Pengalihan Hak Waris Adat', ARRAY['Mepegat', 'Pemutus Hubungan Waris Rumah Pradana'], 'Prosesi pemutusan ikatan waris adat pradana dari sanggah asalnya untuk beralih penuh ke sanggah purusa (atau sebaliknya pada nyentana).', 'Kondisional (Sesuai Dresta)', 'Prajuru Desa Adat / Kelihan Banjar', 'Perlu validasi keluarga/pemangku', 'SRC-003', 'https://phdibali.org/keputusan-seminar', 6, TRUE),
  ('PR-007', 'Pasca Pawiwahan', 'Mejauman / Ketipat Bantal (Kunjungan Balasan)', ARRAY['Ketipat Bantal', 'Mepamit Ring Banjar Asal', 'Mebeji'], 'Kunjungan resmi pengantin baru ke rumah orang tua pradana membawakan ketipat bantal sebagai ungkapan terima kasih dan silaturahmi.', 'Memadik', 'Keluarga Inti Purusa & Pradana', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', 7, TRUE)
ON CONFLICT (id) DO UPDATE SET
  phase = EXCLUDED.phase,
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  description = EXCLUDED.description,
  applicability = EXCLUDED.applicability,
  default_pic = EXCLUDED.default_pic,
  validation_status = EXCLUDED.validation_status,
  source_id = EXCLUDED.source_id,
  source_url = EXCLUDED.source_url,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. RITUAL CATALOG (PACKAGES & CONSTITUENT COMPONENTS)
INSERT INTO public.ritual_catalog (id, item_type, name, used_in_phase, notes, obligation_level, default_quantity, unit, default_provider, validation_status, source_id, source_url, is_active)
VALUES
  ('BN-PKT-001', 'Paket Banten', 'Paket Banten Mebyakala Lengkap', 'Mebyakala', 'Paket pokok ritual pembersihan diri mempelai dari noda dan pengaruh bhuta kala sebelum memasuki grahasta asrama.', 'Pokok dalam Pawiwahan', 1, 'paket', 'Pesan Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-PKT-002', 'Paket Banten', 'Paket Banten Madengen-dengen', 'Madengen-dengen', 'Paket sarana simbolis kehidupan berumah tangga (tegen-tegenan, kala sepetan, tikeh dadakan).', 'Kondisional; validasi sebelum dipakai', 1, 'paket', 'Pesan Serati Banten', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE),
  ('BN-PKT-003', 'Paket Banten', 'Paket Banten Mesakapan / Sanggah Kamulan', 'Mesakapan', 'Paket upacara persaksian ke hadapan Bhatara Hyang Guru dan leluhur di Merajan / Sanggah Kamulan.', 'Pokok dalam Pawiwahan', 1, 'paket', 'Pesan Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-PKT-004', 'Paket Banten', 'Paket Banten Pejati Pasaksi (3 Set)', 'Persiapan & Puncak', 'Banten persembahyangan pasaksi ke Bhatara Surya, Merajan/Pura, dan Saksi Adat/Prajuru.', 'Pokok dalam Pawiwahan', 3, 'paket', 'Pesan Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-PKT-005', 'Paket Banten', 'Paket Banten Jauman / Ketipat Bantal', 'Mejauman', 'Banten hantaran silaturahmi pasca-perkawinan ke keluarga wanita.', 'Kondisional; validasi sebelum dipakai', 1, 'paket', 'Pesan Serati / Buat Sendiri', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE),

  ('BN-ITM-001', 'Banten Satuan', 'Banten Daksina (Linggih Bhatara)', 'Mebyakala', 'Sarana linggih kemahakuasaan Tuhan sebagai saksi upacara.', 'Pokok dalam Pawiwahan', 2, 'tanding', 'Pesan Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-ITM-002', 'Banten Satuan', 'Banten Peras (Penyaksi Keberhasilan Upacara)', 'Mebyakala', 'Simbol permohonan agar upakara berhasil dan disahkan (prasida).', 'Pokok dalam Pawiwahan', 2, 'tanding', 'Pesan Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-ITM-003', 'Banten Satuan', 'Banten Ajuman / Sodan', 'Mebyakala', 'Persembahan suci wujud syukur dan penghormatan.', 'Pokok dalam Pawiwahan', 2, 'tanding', 'Pesan Serati Banten', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-ITM-004', 'Banten Satuan', 'Banten Pesucian & Canang Sari', 'Mebyakala', 'Sarana pembersihan rohani dan persembahan harum kembang.', 'Pokok dalam Pawiwahan', 5, 'tanding', 'Pesan Serati / Buat Sendiri', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-ITM-005', 'Sarana Upakara', 'Tikeh Dadakan (Tikar Anyaman Bambu Segar)', 'Madengen-dengen', 'Tikar bambu/kelapa segar tempat kedua mempelai duduk dan melakukan simbolisasi tawar-menawar hidup.', 'Kondisional; validasi sebelum dipakai', 1, 'buah', 'Siapkan Sendiri', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE),
  ('BN-ITM-006', 'Sarana Upakara', 'Kala Sepetan (Simbol Kerikil & Ranting Duri)', 'Madengen-dengen', 'Simbol cobaan dan duri kehidupan yang harus dibersihkan bersama dalam berumah tangga.', 'Kondisional; validasi sebelum dipakai', 1, 'set', 'Siapkan Sendiri', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE),
  ('BN-ITM-007', 'Sarana Upakara', 'Benang Tridatu / Benang Tebus', 'Mesakapan', 'Benang suci tiga warna perlambang Tri Murti (Brahma, Wisnu, Siwa) pengikat janji suci perkawinan.', 'Pokok dalam Pawiwahan', 1, 'gulung', 'Siapkan Sendiri', 'Tervalidasi Literatur Adat', 'SRC-001', 'https://phdi.or.id', TRUE),
  ('BN-ITM-008', 'Sarana Upakara', 'Tegen-tegenan (Kukusan, Kelapa, Bumbu Dapur)', 'Madengen-dengen', 'Dipikul oleh mempelai pria melambangkan komitmen purusa dalam memikul nafkah keluarga lahir dan batin.', 'Kondisional; validasi sebelum dipakai', 1, 'set', 'Siapkan Sendiri', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE),
  ('BN-ITM-009', 'Sarana Upakara', 'Suun-suunan (Bakul Belanja Tradisional)', 'Madengen-dengen', 'Dijinjing atau disuun oleh mempelai wanita melambangkan kepiawaian pradana dalam mengelola dapur dan rumah tangga.', 'Kondisional; validasi sebelum dipakai', 1, 'set', 'Siapkan Sendiri', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE),
  ('BN-ITM-010', 'Sarana Upakara', 'Sampat Lidi / Sapu Saput (3 Batang)', 'Madengen-dengen', 'Digunakan saat mengitari sanggah kamulan dan menyapu rintangan hidup.', 'Kondisional; validasi sebelum dipakai', 3, 'buah', 'Siapkan Sendiri', 'Perlu validasi keluarga/pemangku', 'SRC-002', 'https://baliloka.id/pustaka/tatwa-pawiwahan', TRUE)
ON CONFLICT (id) DO UPDATE SET
  item_type = EXCLUDED.item_type,
  name = EXCLUDED.name,
  used_in_phase = EXCLUDED.used_in_phase,
  notes = EXCLUDED.notes,
  obligation_level = EXCLUDED.obligation_level,
  default_quantity = EXCLUDED.default_quantity,
  unit = EXCLUDED.unit,
  default_provider = EXCLUDED.default_provider,
  validation_status = EXCLUDED.validation_status,
  source_id = EXCLUDED.source_id,
  source_url = EXCLUDED.source_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
