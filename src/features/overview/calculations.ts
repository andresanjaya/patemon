import type { WeddingCeremony } from "@/features/ceremonies/types";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";
import type { BudgetItem } from "@/features/budget/types";
import type { Vendor } from "@/features/vendors/types";
import type { RundownEvent } from "@/features/rundown/types";
import type {
  CountdownInfo,
  ReadinessScore,
  ReadinessLevel,
  UrgentAction,
  NextUpcomingCeremony,
} from "./types";

/**
 * Normalizes a date string (YYYY-MM-DD) or Date object to a clean midnight UTC timestamp
 * for consistent, timezone-stable day-difference math.
 */
function toMidnightTimestamp(dateInput: string | Date): number {
  if (typeof dateInput === "string") {
    const parts = dateInput.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return Date.UTC(year, month, day);
    }
  }
  const d = new Date(dateInput);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Calculates countdown and milestone details for the wedding prospective date.
 */
export function calculateCountdown(
  prospectiveDate: string | null | undefined,
  referenceDateInput?: Date | string
): CountdownInfo {
  if (!prospectiveDate) {
    return {
      status: "not_set",
      daysRemaining: null,
      milestoneLabel: "Dewasa Ayu Belum Ditentukan",
      formattedDate: null,
      description:
        "Konsultasikan hari baik (Dewasa Ayu) pawiwahan bersama Ida Pedanda atau Pemangku keluarga.",
    };
  }

  const refTime = referenceDateInput
    ? toMidnightTimestamp(referenceDateInput)
    : toMidnightTimestamp(new Date());
  const targetTime = toMidnightTimestamp(prospectiveDate);

  const diffMs = targetTime - refTime;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Formatter for Indonesian long date
  const targetObj = new Date(targetTime);
  const formattedDate = targetObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  if (diffDays > 0) {
    let milestoneLabel = `H-${diffDays} Menuju Hari H`;
    let description = `Tersisa ${diffDays} hari lagi menuju hari suci pawiwahan.`;

    if (diffDays === 1) {
      milestoneLabel = "H-1 (Besok Hari H)";
      description =
        "Persiapan puncak besok. Pastikan seluruh sarana upakara dan panitia siap.";
    } else if (diffDays <= 7) {
      milestoneLabel = `H-${diffDays} (Pekan Ini)`;
      description =
        "Memasuki pekan pelaksanaan. Finalisasi persiapan banten dan gladi resik.";
    } else if (diffDays <= 30) {
      description =
        "Satu bulan menuju pelaksanaan. Konfirmasi kembali rekanan vendor dan serati banten.";
    }

    return {
      status: "upcoming",
      daysRemaining: diffDays,
      milestoneLabel,
      formattedDate,
      description,
    };
  }

  if (diffDays === 0) {
    return {
      status: "today",
      daysRemaining: 0,
      milestoneLabel: "Rahina Pawiwahan (Hari H)",
      formattedDate,
      description:
        "Hari suci pawiwahan berlangsung hari ini. Dumogi labda karya, rahayu lan suksma.",
    };
  }

  const pastDays = Math.abs(diffDays);
  return {
    status: "past",
    daysRemaining: pastDays,
    milestoneLabel: "Pawiwahan Telah Terlaksana",
    formattedDate,
    description: `Rangkaian upacara suci telah terlaksana ${pastDays} hari yang lalu.`,
  };
}

/**
 * Calculates holistic readiness score across 6 key Balinese wedding dimensions.
 */
export function calculateReadinessScore({
  ceremonies = [],
  bantenItems = [],
  tasks = [],
  budgetItems = [],
  targetBudget = 0,
  vendors = [],
  rundownEvents = [],
}: {
  ceremonies?: WeddingCeremony[];
  bantenItems?: BantenItem[];
  tasks?: WeddingTask[];
  budgetItems?: BudgetItem[];
  targetBudget?: number;
  vendors?: Vendor[];
  rundownEvents?: RundownEvent[];
}): ReadinessScore {
  // 1. Ceremonies Dimension (Weight: 20%)
  let ceremoniesScore = 0;
  let scheduledCeremonies = 0;
  if (ceremonies.length > 0) {
    for (const c of ceremonies) {
      let itemScore = 0;
      if (c.scheduledDate) {
        itemScore += 0.6;
        scheduledCeremonies++;
      }
      if (c.location) itemScore += 0.4;
      ceremoniesScore += itemScore;
    }
    ceremoniesScore = Math.min(
      100,
      Math.round((ceremoniesScore / ceremonies.length) * 100)
    );
  }

  // 2. Banten & Ritual Sarana Dimension (Weight: 25%)
  const activeBanten = bantenItems.filter((b) => b.status !== "not_needed");
  let bantenScore = 0;
  let readyBantenCount = 0;
  if (activeBanten.length > 0) {
    let rawScore = 0;
    for (const item of activeBanten) {
      if (item.status === "ready") {
        rawScore += 1.0;
        readyBantenCount++;
      } else if (item.status === "making" || item.status === "ordered") {
        rawScore += 0.65;
      }
      // "needed" = 0
    }
    bantenScore = Math.min(
      100,
      Math.round((rawScore / activeBanten.length) * 100)
    );
  } else if (ceremonies.length > 0) {
    // If ceremonies chosen but no banten listed yet
    bantenScore = 10;
  }

  // 3. Tasks & Checklist Dimension (Weight: 20%)
  const activeTasks = tasks.filter((t) => t.status !== "canceled");
  let taskScore = 0;
  let doneTasksCount = 0;
  if (activeTasks.length > 0) {
    let rawScore = 0;
    for (const task of activeTasks) {
      if (task.status === "done") {
        rawScore += 1.0;
        doneTasksCount++;
      } else if (task.status === "in_progress") {
        rawScore += 0.5;
      }
    }
    taskScore = Math.min(
      100,
      Math.round((rawScore / activeTasks.length) * 100)
    );
  } else if (ceremonies.length > 0) {
    taskScore = 15;
  }

  // 4. Vendors Dimension (Weight: 15%)
  let vendorScore = 0;
  let bookedVendors = 0;
  if (vendors.length > 0) {
    let rawScore = 0;
    for (const v of vendors) {
      if (v.status === "completed" || v.status === "booked") {
        rawScore += 1.0;
        bookedVendors++;
      } else if (v.status === "quoted") {
        rawScore += 0.5;
      } else if (v.status === "contacted") {
        rawScore += 0.25;
      }
    }
    vendorScore = Math.min(100, Math.round((rawScore / vendors.length) * 100));
  }

  // 5. Budget & Finance Dimension (Weight: 10%)
  let budgetScore = 0;
  const activeBudget = budgetItems.filter((i) => i.status !== "canceled");
  if (targetBudget > 0) {
    budgetScore += 30; // Target budget set
    if (activeBudget.length > 0) {
      budgetScore += 30; // Line items itemized
      const totalPaid = activeBudget.reduce(
        (s, i) => s + (i.paidAmount || 0),
        0
      );
      const totalEstimated = activeBudget.reduce(
        (s, i) => s + (i.actualAmount || i.plannedAmount || 0),
        0
      );
      if (totalEstimated > 0) {
        const paidRatio = Math.min(1, totalPaid / totalEstimated);
        budgetScore += Math.round(paidRatio * 40);
      }
    }
  } else if (activeBudget.length > 0) {
    budgetScore = 40;
  }
  budgetScore = Math.min(100, budgetScore);

  // 6. Day-of Rundown Dimension (Weight: 10%)
  let rundownScore = 0;
  if (rundownEvents.length > 0) {
    if (rundownEvents.length >= 8) {
      rundownScore = 100;
    } else if (rundownEvents.length >= 5) {
      rundownScore = 80;
    } else if (rundownEvents.length >= 3) {
      rundownScore = 60;
    } else {
      rundownScore = rundownEvents.length * 20;
    }
  }

  // Weighted overall calculation
  const overallScore = Math.min(
    100,
    Math.round(
      bantenScore * 0.25 +
        ceremoniesScore * 0.2 +
        taskScore * 0.2 +
        vendorScore * 0.15 +
        budgetScore * 0.1 +
        rundownScore * 0.1
    )
  );

  let level: ReadinessLevel = "persiapan_awal";
  let levelLabel = "Persiapan Awal";
  let levelColor =
    "text-zinc-600 bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800";
  let summaryText =
    "Baru memulai perencanaan. Mulai dengan menyusun rangkaian prosesi dan sarana banten.";

  if (overallScore >= 90) {
    level = "siap_hari_h";
    levelLabel = "Siap Menuju Hari H";
    levelColor =
      "text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
    summaryText =
      "Seluruh persiapan inti telah matang dan siap menyongsong hari suci pawiwahan.";
  } else if (overallScore >= 70) {
    level = "hampir_matang";
    levelLabel = "Hampir Matang";
    levelColor =
      "text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    summaryText =
      "Sebagian besar rincian adat, banten, dan teknis telah siap. Lakukan pengecekan akhir.";
  } else if (overallScore >= 45) {
    level = "sebagian_besar_siap";
    levelLabel = "Sebagian Besar Siap";
    levelColor =
      "text-indigo-700 bg-indigo-50 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
    summaryText =
      "Proses berjalan baik. Fokus pada pengadaan sisa sarana upakara dan kepastian vendor.";
  } else if (overallScore >= 20) {
    level = "dalam_proses";
    levelLabel = "Dalam Proses";
    levelColor =
      "text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    summaryText =
      "Fondasi adat telah terbentuk. Lanjutkan pembagian tugas keluarga dan kepastian serati.";
  }

  return {
    overallScore,
    level,
    levelLabel,
    levelColor,
    summaryText,
    categories: {
      banten: {
        category: "banten",
        label: "Upakara & Banten",
        score: bantenScore,
        weight: 0.25,
        totalItems: activeBanten.length,
        completedItems: readyBantenCount,
        description: `${readyBantenCount} dari ${activeBanten.length} sarana siap/dimiliki`,
      },
      ceremonies: {
        category: "ceremonies",
        label: "Rangkaian Adat",
        score: ceremoniesScore,
        weight: 0.2,
        totalItems: ceremonies.length,
        completedItems: scheduledCeremonies,
        description: `${scheduledCeremonies} dari ${ceremonies.length} prosesi berjadwal`,
      },
      tasks: {
        category: "tasks",
        label: "Checklist & Tugas",
        score: taskScore,
        weight: 0.2,
        totalItems: activeTasks.length,
        completedItems: doneTasksCount,
        description: `${doneTasksCount} dari ${activeTasks.length} tugas terselesaikan`,
      },
      vendors: {
        category: "vendors",
        label: "Rekanan & Vendor",
        score: vendorScore,
        weight: 0.15,
        totalItems: vendors.length,
        completedItems: bookedVendors,
        description: `${bookedVendors} dari ${vendors.length} vendor telah booked`,
      },
      budget: {
        category: "budget",
        label: "Anggaran & Biaya",
        score: budgetScore,
        weight: 0.1,
        totalItems: activeBudget.length,
        completedItems: activeBudget.filter((i) => i.status === "paid_full")
          .length,
        description: `${budgetScore}% kesiapan alokasi finansial`,
      },
      rundown: {
        category: "rundown",
        label: "Susunan Acara (Rundown)",
        score: rundownScore,
        weight: 0.1,
        totalItems: rundownEvents.length,
        completedItems: rundownEvents.length,
        description: `${rundownEvents.length} segmen acara tersusun`,
      },
    },
  };
}

/**
 * Extracts top urgent and overdue actionable items for the Action Center.
 */
export function getUrgentActions({
  weddingId,
  tasks = [],
  bantenItems = [],
  ceremonies = [],
  referenceDateInput,
}: {
  weddingId: string;
  tasks?: WeddingTask[];
  bantenItems?: BantenItem[];
  ceremonies?: WeddingCeremony[];
  referenceDateInput?: Date | string;
}): UrgentAction[] {
  const actions: UrgentAction[] = [];
  const refTime = referenceDateInput
    ? toMidnightTimestamp(referenceDateInput)
    : toMidnightTimestamp(new Date());

  // 1. Overdue checklist tasks
  const overdueTasks = tasks.filter((t) => {
    if (t.status === "done" || t.status === "canceled" || !t.dueDate) {
      return false;
    }
    return toMidnightTimestamp(t.dueDate) < refTime;
  });

  for (const t of overdueTasks) {
    actions.push({
      id: `task-overdue-${t.id}`,
      type: "task",
      title: t.title,
      description: `Tugas terlewat dari target (${new Date(t.dueDate!).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}). Segera selesaikan.`,
      priority: "urgent",
      actionUrl: `/workspace/${weddingId}/tasks`,
      actionLabel: "Buka Checklist",
      dueDate: t.dueDate,
      isOverdue: true,
    });
  }

  // 2. Urgent / High priority pending tasks
  const pendingUrgentTasks = tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "canceled" &&
      (t.priority === "urgent" || t.priority === "high") &&
      !overdueTasks.some((ot) => ot.id === t.id)
  );

  for (const t of pendingUrgentTasks.slice(0, 3)) {
    actions.push({
      id: `task-urgent-${t.id}`,
      type: "task",
      title: t.title,
      description: t.assigneeName
        ? `PIC: ${t.assigneeName} · Prioritas ${t.priority.toUpperCase()}`
        : `Belum ada PIC yang ditugaskan · Prioritas ${t.priority.toUpperCase()}`,
      priority: t.priority === "urgent" ? "urgent" : "high",
      actionUrl: `/workspace/${weddingId}/tasks`,
      actionLabel: "Tinjau Tugas",
      dueDate: t.dueDate,
      isOverdue: false,
    });
  }

  // 3. Unassigned / Needed banten
  const neededBanten = bantenItems.filter((b) => b.status === "needed");
  if (neededBanten.length > 0) {
    actions.push({
      id: "banten-needed-summary",
      type: "banten",
      title: `${neededBanten.length} Sarana Banten Belum Ditentukan Sumbernya`,
      description: `Contoh: ${neededBanten
        .slice(0, 2)
        .map((b) => b.name || "Sarana")
        .join(
          ", "
        )}${neededBanten.length > 2 ? `, dan ${neededBanten.length - 2} lainnya.` : "."} Tentukan apakah pesan ke serati atau ngayah keluarga.`,
      priority: neededBanten.length >= 5 ? "urgent" : "high",
      actionUrl: `/workspace/${weddingId}/banten`,
      actionLabel: "Kelola Banten",
    });
  }

  // 4. Ceremonies without schedule date
  const unscheduledCeremonies = ceremonies.filter((c) => !c.scheduledDate);
  if (unscheduledCeremonies.length > 0) {
    actions.push({
      id: "ceremonies-unscheduled",
      type: "ceremony",
      title: `${unscheduledCeremonies.length} Prosesi Adat Belum Memiliki Tanggal`,
      description: `Rangkaian prosesi (${unscheduledCeremonies
        .slice(0, 2)
        .map((c) => c.title)
        .join(
          ", "
        )}) belum memiliki tanggal pelaksanaan yang pasti. Konsultasikan Dewasa Ayu.`,
      priority: "high",
      actionUrl: `/workspace/${weddingId}/ceremonies`,
      actionLabel: "Atur Jadwal",
    });
  }

  return actions.slice(0, 5);
}

/**
 * Returns the next upcoming ceremony based on reference date.
 */
export function getNextUpcomingCeremony({
  ceremonies = [],
  bantenItems = [],
  tasks = [],
  referenceDateInput,
}: {
  ceremonies?: WeddingCeremony[];
  bantenItems?: BantenItem[];
  tasks?: WeddingTask[];
  referenceDateInput?: Date | string;
}): NextUpcomingCeremony | null {
  if (ceremonies.length === 0) return null;

  const refTime = referenceDateInput
    ? toMidnightTimestamp(referenceDateInput)
    : toMidnightTimestamp(new Date());

  // Filter ceremonies that have dates and are either today or in the future
  const upcoming = ceremonies
    .filter(
      (c) => c.scheduledDate && toMidnightTimestamp(c.scheduledDate) >= refTime
    )
    .sort(
      (a, b) =>
        toMidnightTimestamp(a.scheduledDate!) -
        toMidnightTimestamp(b.scheduledDate!)
    );

  const target = upcoming.length > 0 ? upcoming[0] : ceremonies[0];

  let daysUntil: number | null = null;
  let formattedDate: string | null = null;

  if (target.scheduledDate) {
    const ceremonyTime = toMidnightTimestamp(target.scheduledDate);
    daysUntil = Math.round((ceremonyTime - refTime) / (1000 * 60 * 60 * 24));
    formattedDate = new Date(ceremonyTime).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const linkedBantenCount = bantenItems.filter(
    (b) => b.ceremonyId === target.id
  ).length;
  const linkedTaskCount = tasks.filter(
    (t) => t.ceremonyId === target.id
  ).length;

  return {
    id: target.id,
    title: target.title,
    scheduledDate: target.scheduledDate,
    formattedDate,
    location: target.location,
    daysUntil,
    bantenCount: linkedBantenCount,
    taskCount: linkedTaskCount,
    personInCharge: target.personInCharge || null,
  };
}
