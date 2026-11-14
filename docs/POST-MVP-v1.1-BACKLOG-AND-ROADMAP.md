# Rencana Pengembangan Pasca-MVP & Backlog v1.1 (Post-MVP Backlog & Roadmap)

Dokumen ini merangkum inisiatif, fitur penyempurnaan, serta masukan yang dihimpun selama pengujian penerimaan pengguna (UAT) untuk dirilis pada siklus pembaruan **Patemon v1.1** dan seterusnya ([Issue #45](https://github.com/andresanjaya/patemon/issues/45)).

---

## 1. Ringkasan Prioritas Rilis Masa Depan

Berdasarkan umpan balik dari calon mempelai, keluarga banjar, dan serati banten selama UAT MVP v1:
- **v1.0.1 (Fast Follows - Maintenance & Minor Polish):** Peningkatan teks petunjuk ritual dan filter banten berdasarkan tahapan pengerjaan.
- **v1.1 (Enhanced Collaboration & Guest Experience):** Generator pesan undangan digital personal WhatsApp, tata denah meja tamu resepsi, dan diagram visual tata letak banten di merajan.
- **v1.2 (Offline Progressive Web App - PWA):** Dukungan penuh *service worker* untuk akses offline saat berada di daerah pura terpencil tanpa koneksi seluler.

---

## 2. Rincian Backlog v1.1

### 2.1 FB-06: Generator Teks Undangan WhatsApp Personal (Personalized Invitation Dispatcher)
- **Kategori:** Buku Tamu & Komunikasi Keluarga
- **Latar Belakang:** Pasangan sering kali mengirim undangan digital satu per satu via WhatsApp dan harus mengetik ulang nama tamu beserta gelar kehormatan (*"Ida Bagus...", "Anak Agung...", "Jero Mangku..."*).
- **Spesifikasi:**
  - Tombol aksi *"Kirim Tautan Undangan"* di sebelah baris tamu pada tabel Buku Tamu.
  - Template pesan dinamis: *"Om Swastyastu [Nama Tamu / Gelar], dengan rasa bahagia kami bermaksud mengundang Bapak/Ibu/Saudara/i..."*.
  - Menghasilkan tautan langsung `wa.me` dengan teks yang terformat rapi.

### 2.2 FB-05: Panduan Visual Tata Letak Banten ring Merajan (Visual Ritual Layout Guide)
- **Kategori:** Banten & Edukasi Adat
- **Latar Belakang:** Anggota keluarga krama istri sering membutuhkan pengingat visual mengenai di mana letak *Banten Pejati*, *Dapetan*, atau *Bebangkit* harus dihaturkan di pelinggih Merajan.
- **Spesifikasi:**
  - Skema diagram tata letak pelinggih (Rong Tiga, Kemulan, Taksu, Penunggun Karang).
  - Penandaan banten mana yang ditempatkan di bale pawedan, bale dangin, maupun kori agung.

### 2.3 Denah Interaktif Meja & Pengelompokan Tamu (Seating & Table Arrangement)
- **Kategori:** Buku Tamu & Resepsi
- **Latar Belakang:** Untuk resepsi atau ramah tamah yang menyediakan meja VIP untuk sulinggih, prajuru adat, dan keluarga besar besan.
- **Spesifikasi:**
  - Penugasan nomor meja atau kelompok duduk per tamu.
  - Ringkasan kapasitas per meja agar tidak over-capacity.

### 2.4 Notifikasi Pengingat WhatsApp / Push H-7 & H-1 (Automated Task Reminders)
- **Kategori:** Checklist & Kesiapan
- **Latar Belakang:** Membantu PIC keluarga mengingat tugas penting tanpa harus membuka aplikasi setiap saat.
- **Spesifikasi:**
  - Integrasi pengingat berkala H-7 dan H-1 ke nomor WhatsApp PIC tugas yang berstatus *"urgent"*.

---

## 3. Matriks Roadmap Rilis

| Versi | Target Waktu | Fokus Utama |
| :---: | :---: | :--- |
| **v1.0.0** | **November 2026** | **Peluncuran MVP v1 Resmi (12 Modul Inti Selesai)** |
| **v1.0.1** | **Desember 2026** | Polish petunjuk adat & optimasi kueri dashboard kesiapan |
| **v1.1.0** | **Q1 2027** | Generator undangan WhatsApp personal & tata denah tamu |
| **v1.2.0** | **Q2 2027** | Offline PWA caching & diagram visual tata letak banten |
