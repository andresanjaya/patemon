import workbook from "@/data/wedding-master-data.json";

export function MasterDataReference() {
  return (
    <section
      className="workspace-card mt-8"
      aria-labelledby="master-reference-title"
    >
      <div className="workspace-card-header">
        <h2 id="master-reference-title" className="text-sm font-semibold">
          Master data hasil riset
        </h2>
      </div>
      <div className="space-y-4 p-5 text-sm">
        <p className="text-muted-foreground">
          20 prosesi · 66 banten & sarana · 157 tugas · 119 item anggaran · 22
          kategori vendor. Seluruh daftar tersedia di menu terkait dan
          rekomendasi. Template bukan kewajiban adat universal; konfirmasi
          dengan keluarga, serati, dan pemangku.
        </p>
        <p className="text-muted-foreground">
          Excel tidak memuat daftar tamu, jadwal rundown, atau riwayat
          aktivitas. Menu tersebut memakai simulasi terpisah, bukan hasil riset
          Excel.
        </p>
        {(["Onboarding", "Sumber", "Mulai_Di_Sini"] as const).map((name) => {
          const rows = workbook[name];
          return (
            <details key={name} className="border-border rounded-lg border p-3">
              <summary className="cursor-pointer font-medium">
                {name.replaceAll("_", " ")} ·{" "}
                {name === "Mulai_Di_Sini"
                  ? "Panduan workbook"
                  : `${rows.length - 1} referensi`}
              </summary>
              <div className="mt-3 space-y-3">
                {rows
                  .slice(name === "Mulai_Di_Sini" ? 0 : 1)
                  .map((row, index) => (
                    <div
                      key={index}
                      className="border-border space-y-1 border-t pt-3 text-xs"
                    >
                      {Object.entries(row)
                        .filter(([, value]) => value)
                        .map(([key, value]) => (
                          <p key={key} className="break-words">
                            {value.startsWith("https://") ? (
                              <a
                                className="text-primary underline"
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {value}
                              </a>
                            ) : (
                              value
                            )}
                          </p>
                        ))}
                    </div>
                  ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
