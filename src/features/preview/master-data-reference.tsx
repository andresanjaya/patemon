"use client";

import { useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Database,
  ExternalLink,
  Info,
  Layers,
  Library,
} from "lucide-react";
import workbook from "@/data/wedding-master-data.json";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReferenceTab = "guide" | "onboarding" | "sources";

export function MasterDataReference() {
  const [activeTab, setActiveTab] = useState<ReferenceTab>("guide");

  const startRows = workbook.Mulai_Di_Sini;
  const metrics = startRows.slice(3, 8).map((row) => ({
    label: row.A,
    value: row.B,
    note: row.C || "",
  }));
  const usageSteps = startRows.slice(9, 16).map((row) => ({
    step: row.A,
    description: row.B,
  }));
  const architectureNote = startRows[16]?.A || "";

  const onboardingRows = workbook.Onboarding.slice(1);
  const sourceRows = workbook.Sumber.slice(1);

  return (
    <Card
      className="dark:border-border/80 dark:bg-card mt-8 overflow-hidden border-[#e5e5e9] bg-white shadow-xs"
      aria-labelledby="master-reference-title"
    >
      <CardHeader className="dark:border-border/60 mb-0 flex flex-col gap-3 border-b border-[#f0f0f4] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
              <Database className="h-4 w-4" />
            </div>
            <CardTitle
              id="master-reference-title"
              className="text-foreground text-base font-bold"
            >
              Master Data Hasil Riset
            </CardTitle>
            <Badge variant="secondary" className="text-[11px] font-medium">
              Pustaka Referensi
            </Badge>
          </div>
          <CardDescription className="text-xs leading-relaxed">
            Dataset awal perencanaan pawiwahan Hindu Bali — template adaptif
            yang perlu dikonfirmasi bersama keluarga, serati, dan pemangku
            setempat.
          </CardDescription>
        </div>

        {/* Segmented Tabs matching Keenthemes Workspace Style */}
        <div className="border-border/80 bg-muted/30 inline-flex shrink-0 flex-wrap items-center rounded-lg border p-0.5 text-xs">
          <Button
            type="button"
            variant={activeTab === "guide" ? "secondary" : "ghost"}
            size={null}
            onClick={() => setActiveTab("guide")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium shadow-none transition-all",
              activeTab === "guide"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Panduan</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "onboarding" ? "secondary" : "ghost"}
            size={null}
            onClick={() => setActiveTab("onboarding")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium shadow-none transition-all",
              activeTab === "onboarding"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Onboarding</span>
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
              {onboardingRows.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "sources" ? "secondary" : "ghost"}
            size={null}
            onClick={() => setActiveTab("sources")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium shadow-none transition-all",
              activeTab === "sources"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Library className="h-3.5 w-3.5" />
            <span>Sumber</span>
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
              {sourceRows.length}
            </Badge>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 sm:p-6">
        {/* Metric Summary Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="dark:border-border/80 dark:bg-muted/20 flex flex-col justify-between rounded-xl border border-[#e9e9ed] bg-[#f9f9fb]/70 p-3.5"
            >
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[11px] font-medium">
                  {metric.label}
                </span>
                <span className="text-foreground block text-2xl font-bold tracking-tight tabular-nums">
                  {metric.value}
                </span>
              </div>
              {metric.note && (
                <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
                  {metric.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Scope Notice Alert */}
        <Alert
          variant="info"
          className="dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100 [&>svg]:dark:text-blue-400"
        >
          <Info className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">
            Cakupan Data Simulasi vs Hasil Riset
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            Seluruh daftar prosesi, banten, checklist, pos anggaran, dan
            kategori vendor tersedia pada menu masing-masing. Daftar tamu,
            jadwal rundown hari-H, dan riwayat aktivitas pada mode pratinjau ini
            menggunakan simulasi terpisah di luar dokumen riset Excel.
          </AlertDescription>
        </Alert>

        {/* Tab 1: Panduan Workbook */}
        {activeTab === "guide" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                <Layers className="text-primary h-3.5 w-3.5" />
                <span>Panduan Penggunaan Dataset (7 Prinsip)</span>
              </h3>
              <Badge variant="outline" className="text-[11px]">
                Mulai Di Sini
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {usageSteps.map((item) => (
                <div
                  key={item.step}
                  className="dark:border-border/80 dark:bg-card flex items-start gap-3 rounded-xl border border-[#e9e9ed] bg-white p-3.5 shadow-2xs"
                >
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary mt-0.5 h-6 min-w-7 justify-center rounded-md px-1.5 font-mono text-[11px] font-bold"
                  >
                    {item.step}
                  </Badge>
                  <p className="text-foreground text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {architectureNote && (
              <div className="dark:border-border/80 dark:bg-muted/20 text-muted-foreground rounded-xl border border-dashed border-[#e5e5e9] bg-[#f9f9fb] px-4 py-3 text-xs leading-relaxed">
                <span className="text-foreground font-semibold">
                  Catatan Struktur Data:{" "}
                </span>
                {architectureNote.replace(
                  /^Saran struktur database:\s*/i,
                  ""
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Onboarding */}
        {activeTab === "onboarding" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Daftar Field Onboarding Workspace
              </h3>
              <Badge variant="outline" className="text-[11px]">
                {onboardingRows.length} Field
              </Badge>
            </div>
            <Table aria-label="Tabel Referensi Field Onboarding">
              <colgroup>
                {["10%", "26%", "14%", "36%", "14%"].map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>
              <TableHeader>
                <TableRow className="dark:bg-muted/40 border-b border-[#e9e9ed] bg-[#f9f9fb]">
                  <TableHead>ID</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Tipe Input</TableHead>
                  <TableHead>Aturan &amp; Helper</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboardingRows.map((row) => (
                  <TableRow key={row.A}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {row.A}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {row.B}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-normal capitalize"
                      >
                        {row.C}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.D}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium"
                      >
                        {row.E}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 3: Sumber Referensi */}
        {activeTab === "sources" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Pustaka &amp; Sumber Riset Adat
              </h3>
              <Badge variant="outline" className="text-[11px]">
                {sourceRows.length} Referensi
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sourceRows.map((row) => (
                <div
                  key={row.A}
                  className="dark:border-border/80 dark:bg-card flex flex-col justify-between gap-3 rounded-xl border border-[#e9e9ed] bg-white p-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px] font-bold"
                      >
                        {row.A}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {row.C}
                      </Badge>
                    </div>
                    <h4 className="text-foreground text-xs leading-snug font-semibold">
                      {row.B}
                    </h4>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {row.D}
                    </p>
                  </div>
                  {row.E && row.E.startsWith("https://") && (
                    <div className="border-border/60 flex justify-end border-t pt-2.5">
                      <Button
                        variant="outline"
                        size="xs"
                        asChild
                        className="gap-1.5 text-[11px]"
                      >
                        <a
                          href={row.E}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Buka Referensi</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
