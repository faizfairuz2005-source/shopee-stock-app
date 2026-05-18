// ─── Expense Categories ────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "Listrik",
  "Air",
  "Sewa",
  "Gaji Karyawan",
  "Transportasi",
  "ATK & Perlengkapan",
  "Internet & Telepon",
  "Promosi & Iklan",
  "Perawatan & Perbaikan",
  "Kebersihan",
  "Keamanan",
  "Konsumsi",
  "Lainnya",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
