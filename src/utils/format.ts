import { ExpenseCategory, ExpenseItem } from "../types";

export function formatKrw(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export function formatWonSymbol(amount: number): string {
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}

export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  if (!year || !month) return ym;
  return `${year}년 ${Number(month)}월`;
}

export function formatDateWithDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}월 ${Number(day)}일 (${days[d.getDay()]})`;
}

export const CATEGORY_COLOR_DOT: Record<ExpenseCategory, string> = {
  "식비": "bg-emerald-600",
  "배달·외식": "bg-rose-600",
  "카페·간식": "bg-amber-600",
  "쇼핑·의류": "bg-indigo-600",
  "생활·마트": "bg-teal-600",
  "교통·차량": "bg-sky-600",
  "구독·통신": "bg-slate-600",
  "문화·여가": "bg-violet-600",
  "건강·의료": "bg-cyan-600",
  "기타": "bg-zinc-500",
};

export const CATEGORY_BAR_HEX: Record<ExpenseCategory, string> = {
  "식비": "#059669",
  "배달·외식": "#E11D48",
  "카페·간식": "#D97706",
  "쇼핑·의류": "#4F46E5",
  "생활·마트": "#0D9488",
  "교통·차량": "#0284C7",
  "구독·통신": "#475569",
  "문화·여가": "#7C3AED",
  "건강·의료": "#0891B2",
  "기타": "#71717A",
};

export function exportExpensesToCsv(expenses: ExpenseItem[], month: string) {
  const header = ["날짜", "카테고리", "지출 내역", "금액(원)", "메모"];
  const rows = [...expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [
      e.date,
      e.category,
      `"${e.title.replace(/"/g, '""')}"`,
      String(e.amount),
      `"${(e.memo || "").replace(/"/g, '""')}"`,
    ]);

  const csvContent = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `savenote-ledger-${month}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
