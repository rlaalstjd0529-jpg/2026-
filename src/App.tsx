import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AiAnalysisView } from "./components/AiAnalysisView";
import { BudgetSettingsView } from "./components/BudgetSettingsView";
import { Footer } from "./components/Footer";
import { LedgerView } from "./components/LedgerView";
import { Sidebar } from "./components/Sidebar";
import {
  DEFAULT_CATEGORY_BUDGETS,
  DEFAULT_MONTHLY_BUDGET,
  SAMPLE_EXPENSES,
} from "./data/sampleExpenses";
import {
  ActiveTab,
  AiAnalysisResponse,
  ExpenseCategory,
  ExpenseItem,
} from "./types";
import { formatMonthLabel } from "./utils/format";

const STORAGE_KEYS = {
  expenses: "savenote_expenses_v1",
  monthlyBudget: "savenote_monthly_budget_v1",
  categoryBudgets: "savenote_category_budgets_v1",
  analysisByMonth: "savenote_analysis_by_month_v1",
  checkedStrategies: "savenote_checked_strategies_v1",
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("ledger");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-11");

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() =>
    loadJson<ExpenseItem[]>(STORAGE_KEYS.expenses, SAMPLE_EXPENSES)
  );
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() =>
    loadJson<number>(STORAGE_KEYS.monthlyBudget, DEFAULT_MONTHLY_BUDGET)
  );
  const [categoryBudgets, setCategoryBudgets] = useState<Record<ExpenseCategory, number>>(() =>
    loadJson<Record<ExpenseCategory, number>>(
      STORAGE_KEYS.categoryBudgets,
      DEFAULT_CATEGORY_BUDGETS
    )
  );
  const [analysisByMonth, setAnalysisByMonth] = useState<Record<string, AiAnalysisResponse>>(() =>
    loadJson<Record<string, AiAnalysisResponse>>(STORAGE_KEYS.analysisByMonth, {})
  );
  const [checkedStrategies, setCheckedStrategies] = useState<string[]>(() =>
    loadJson<string[]>(STORAGE_KEYS.checkedStrategies, [])
  );

  const [dirtyMonths, setDirtyMonths] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
    } catch {
      // Ignore storage quota errors
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.monthlyBudget, String(monthlyBudget));
    } catch {
      // Ignore
    }
  }, [monthlyBudget]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.categoryBudgets, JSON.stringify(categoryBudgets));
    } catch {
      // Ignore
    }
  }, [categoryBudgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.analysisByMonth, JSON.stringify(analysisByMonth));
    } catch {
      // Ignore
    }
  }, [analysisByMonth]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.checkedStrategies, JSON.stringify(checkedStrategies));
    } catch {
      // Ignore
    }
  }, [checkedStrategies]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>(["2026-12", "2026-11", "2026-10"]);
    for (const exp of expenses) {
      if (/^\d{4}-\d{2}/.test(exp.date)) {
        monthSet.add(exp.date.slice(0, 7));
      }
    }
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  );

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  );

  const markMonthDirty = useCallback((ym: string) => {
    setDirtyMonths((prev) => ({ ...prev, [ym]: true }));
  }, []);

  const handleAddExpense = (item: Omit<ExpenseItem, "id">) => {
    const newItem: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setExpenses((prev) => [newItem, ...prev]);
    const ym = item.date.slice(0, 7);
    if (ym && ym !== selectedMonth && /^\d{4}-\d{2}$/.test(ym)) {
      setSelectedMonth(ym);
    }
    markMonthDirty(ym || selectedMonth);
  };

  const handleAddMultipleExpenses = (items: Omit<ExpenseItem, "id">[]) => {
    const created: ExpenseItem[] = items.map((item, idx) => ({
      ...item,
      id: `exp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
    }));
    setExpenses((prev) => [...created, ...prev]);
    for (const it of created) {
      markMonthDirty(it.date.slice(0, 7));
    }
  };

  const handleUpdateExpense = (updated: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    markMonthDirty(updated.date.slice(0, 7));
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (target) {
      markMonthDirty(target.date.slice(0, 7));
    }
  };

  const handleClearMonth = () => {
    setExpenses((prev) => prev.filter((e) => !e.date.startsWith(selectedMonth)));
    markMonthDirty(selectedMonth);
  };

  const handleRestoreSample = () => {
    setExpenses((prev) => {
      const others = prev.filter((e) => !e.date.startsWith("2026-11"));
      return [...SAMPLE_EXPENSES, ...others];
    });
    setSelectedMonth("2026-11");
    markMonthDirty("2026-11");
  };

  const handleSaveBudgets = (nextMonthly: number, nextCategories: Record<ExpenseCategory, number>) => {
    setMonthlyBudget(nextMonthly);
    setCategoryBudgets(nextCategories);
    markMonthDirty(selectedMonth);
  };

  const handleResetBudgetDefaults = () => {
    setMonthlyBudget(DEFAULT_MONTHLY_BUDGET);
    setCategoryBudgets(DEFAULT_CATEGORY_BUDGETS);
    markMonthDirty(selectedMonth);
  };

  const handleToggleStrategy = (title: string) => {
    setCheckedStrategies((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const runAiAnalysis = useCallback(async () => {
    setActiveTab("analysis");
    if (monthExpenses.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          monthlyBudget,
          categoryBudgets,
          expenses: monthExpenses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI 분석 요청 처리 중 오류가 발생했습니다.");
      }

      setAnalysisByMonth((prev) => ({
        ...prev,
        [selectedMonth]: data as AiAnalysisResponse,
      }));
      setDirtyMonths((prev) => ({ ...prev, [selectedMonth]: false }));
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "서버와 통신하는 중 문제가 발생했습니다."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [monthExpenses, selectedMonth, monthlyBudget, categoryBudgets]);

  const currentAnalysis = analysisByMonth[selectedMonth] || null;
  const hasUnsavedAnalysisChanges = Boolean(dirtyMonths[selectedMonth] && currentAnalysis);

  const tabBreadcrumb =
    activeTab === "ledger"
      ? "가계부 · 지출 내역"
      : activeTab === "analysis"
      ? "AI 소비 분석 리포트"
      : "예산 · 카테고리 설정";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <div className="flex-1 flex flex-col lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onSelectMonth={setSelectedMonth}
        totalSpent={totalSpent}
        monthlyBudget={monthlyBudget}
        hasUnsavedAnalysisChanges={hasUnsavedAnalysisChanges}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
            <span className="truncate">{formatMonthLabel(selectedMonth)}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900 truncate">{tabBreadcrumb}</span>
          </div>

          <button
            type="button"
            onClick={runAiAnalysis}
            disabled={isAnalyzing || monthExpenses.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 소비 습관 분석하기</span>
              </>
            )}
          </button>
        </header>

        <main className="flex-1 p-5 sm:p-7 max-w-[1200px] w-full mx-auto">
          {activeTab === "ledger" && (
            <LedgerView
              selectedMonth={selectedMonth}
              expenses={monthExpenses}
              monthlyBudget={monthlyBudget}
              categoryBudgets={categoryBudgets}
              onAddExpense={handleAddExpense}
              onAddMultipleExpenses={handleAddMultipleExpenses}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onUpdateMonthlyBudget={(next) => {
                setMonthlyBudget(next);
                markMonthDirty(selectedMonth);
              }}
              onOpenBudgetSettings={() => setActiveTab("budget")}
              onClearMonth={handleClearMonth}
              onRestoreSample={handleRestoreSample}
              onGoToAnalysis={runAiAnalysis}
            />
          )}

          {activeTab === "analysis" && (
            <AiAnalysisView
              selectedMonth={selectedMonth}
              expenseCount={monthExpenses.length}
              totalSpent={totalSpent}
              analysisResult={currentAnalysis}
              isLoading={isAnalyzing}
              error={analysisError}
              hasUnsavedChanges={hasUnsavedAnalysisChanges}
              checkedStrategies={checkedStrategies}
              onToggleStrategy={handleToggleStrategy}
              onRunAnalysis={runAiAnalysis}
              onGoToLedger={() => setActiveTab("ledger")}
            />
          )}

          {activeTab === "budget" && (
            <BudgetSettingsView
              monthlyBudget={monthlyBudget}
              categoryBudgets={categoryBudgets}
              expenses={monthExpenses}
              onSaveBudgets={handleSaveBudgets}
              onResetDefaults={handleResetBudgetDefaults}
            />
          )}
        </main>
      </div>
      </div>

      <Footer />
    </div>
  );
}
