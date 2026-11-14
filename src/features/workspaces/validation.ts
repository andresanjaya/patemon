import type { CreateWorkspaceInput, MarriageForm } from "./types";

export const MARRIAGE_FORMS: {
  value: MarriageForm;
  label: string;
  description: string;
}[] = [
  {
    value: "memadik",
    label: "Memadik / Ngidih (Umum)",
    description:
      "Bentuk peminangan adat umum di mana pihak purusa (pria) meminang pradana (wanita) ke rumah keluarga wanita.",
  },
  {
    value: "ngerorod",
    label: "Ngerorod / Rangkat",
    description:
      "Bentuk perkawinan atas dasar kesepakatan bersama kedua mempelai dengan tata cara adat pelarian yang diakhiri persidangan adat/mesakapan.",
  },
  {
    value: "nyentana",
    label: "Nyentana / Sentana Rajeg",
    description:
      "Bentuk perkawinan di mana pihak wanita berkedudukan sebagai purusa dan pihak pria berkedudukan sebagai pradana di rumah wanita.",
  },
  {
    value: "custom",
    label: "Kustom / Penyesuaian Keluarga",
    description:
      "Penyesuaian tata cara adat hasil rembug bersama kedua belah keluarga atau perkawinan campur antar-dresta.",
  },
];

export const BALI_REGIONS = [
  "Badung",
  "Bangli",
  "Buleleng",
  "Denpasar",
  "Gianyar",
  "Jembrana",
  "Karangasem",
  "Klungkung",
  "Tabanan",
  "Luar Bali / Rantau",
] as const;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateWorkspaceInput(
  input: Partial<CreateWorkspaceInput>
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.coupleNames || input.coupleNames.trim().length === 0) {
    errors.coupleNames = "Nama pasangan atau judul pawiwahan wajib diisi.";
  } else if (input.coupleNames.trim().length < 2) {
    errors.coupleNames = "Nama pasangan minimal 2 karakter.";
  } else if (input.coupleNames.trim().length > 150) {
    errors.coupleNames = "Nama pasangan maksimal 150 karakter.";
  }

  if (
    input.marriageForm &&
    !["memadik", "ngerorod", "nyentana", "custom"].includes(input.marriageForm)
  ) {
    errors.marriageForm = "Bentuk perkawinan adat tidak valid.";
  }

  if (input.targetBudget !== undefined && input.targetBudget !== null) {
    if (isNaN(input.targetBudget) || input.targetBudget < 0) {
      errors.targetBudget = "Estimasi anggaran tidak boleh bernilai negatif.";
    } else if (!Number.isSafeInteger(Number(input.targetBudget))) {
      errors.targetBudget =
        "Nominal anggaran melebihi batas yang diperbolehkan.";
    }
  }

  if (input.prospectiveDate && input.prospectiveDate.trim().length > 0) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.prospectiveDate.trim())) {
      errors.prospectiveDate = "Format tanggal harus YYYY-MM-DD.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMarriageForm(form: MarriageForm): string {
  switch (form) {
    case "memadik":
      return "Memadik / Ngidih";
    case "ngerorod":
      return "Ngerorod / Rangkat";
    case "nyentana":
      return "Nyentana";
    case "custom":
      return "Kustom / Campuran";
    default:
      return form;
  }
}
