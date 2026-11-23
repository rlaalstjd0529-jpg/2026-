export const EXPENSE_CATEGORIES = [
  "식비",
  "배달·외식",
  "카페·간식",
  "쇼핑·의류",
  "생활·마트",
  "교통·차량",
  "구독·통신",
  "문화·여가",
  "건강·의료",
  "기타",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: ExpenseCategory;
  amount: number;
  memo?: string;
}

export interface HabitItem {
  title: string;
  patternDetail: string;
  impactLevel: "높음" | "보통" | "낮음";
  evidenceDates: string;
}

export interface OverspendingArea {
  category: string;
  spentAmount: number;
  recommendedCap: number;
  excessAmount: number;
  reason: string;
  triggerItems: string[];
}

export interface SavingStrategy {
  title: string;
  category: string;
  expectedMonthlySaving: number;
  difficulty: "쉬움" | "보통" | "도전";
  actionStep: string;
}

export interface AiAnalysisPayload {
  headlineSummary: string;
  spendingPersona: string;
  monthlySaveableAmount: number;
  saveableBasis: string;
  habitAnalysis: HabitItem[];
  overspendingAreas: OverspendingArea[];
  savingStrategies: SavingStrategy[];
  immediateActions: string[];
}

export interface AiAnalysisResponse {
  analyzedAt: string;
  stats: {
    totalSpent: number;
    monthlyBudget: number;
    transactionCount: number;
  };
  analysis: AiAnalysisPayload;
}

export type ActiveTab = "ledger" | "analysis" | "budget";
