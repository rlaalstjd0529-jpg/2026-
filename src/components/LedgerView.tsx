import { BookOpen, Check, Download, Pencil, RotateCcw, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, ExpenseCategory, ExpenseItem } from "../types";
import {
  CATEGORY_BAR_HEX,
  exportExpensesToCsv,
  formatDateWithDay,
  formatKrw,
  formatMonthLabel,
} from "../utils/format";
import { ExpenseForm } from "./ExpenseForm";
import { SpendingCharts } from "./SpendingCharts";
import { SpotThumbnail } from "./SpotThumbnail";

interface LedgerViewProps {
  selectedMonth: string;
  expenses: ExpenseItem[];
  monthlyBudget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
  onAddExpense: (item: Omit<ExpenseItem, "id">) => void;
  onAddMultipleExpenses: (items: Omit<ExpenseItem, "id">[]) => void;
  onUpdateExpense: (updated: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateMonthlyBudget: (nextBudget: number) => void;
  onOpenBudgetSettings: () => void;
  onClearMonth: () => void;
  onRestoreSample: () => void;
  onGoToAnalysis: () => void;
}

export function LedgerView({
  selectedMonth,
  expenses,
  monthlyBudget,
  categoryBudgets,
  onAddExpense,
  onAddMultipleExpenses,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateMonthlyBudget,
  onOpenBudgetSettings,
  onClearMonth,
  onRestoreSample,
  onGoToAnalysis,
}: LedgerViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ExpenseItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [budgetEditing, setBudgetEditing] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(monthlyBudget));
  const [budgetSavedMsg, setBudgetSavedMsg] = useState(false);

  useEffect(() => {
    setBudgetDraft(String(monthlyBudget));
  }, [monthlyBudget]);

  const handleSaveMonthlyBudget = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Math.max(100, Math.round(Number(budgetDraft) || monthlyBudget));
    onUpdateMonthlyBudget(parsed);
    setBudgetDraft(String(parsed));
    setBudgetEditing(false);
    setBudgetSavedMsg(true);
    setTimeout(() => setBudgetSavedMsg(false), 2000);
  };

  const adjustBudgetDraft = (delta: number) => {
    const current = Number(budgetDraft) || 0;
    setBudgetDraft(String(Math.max(100, current + delta)));
  };

  const summary = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const activeDates = new Set(expenses.map((e) => e.date)).size || 1;
    const catTotals: Record<string, number> = {};
    for (const e of expenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    }
    const topCategoryEntry = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    return {
      total,
      remaining: monthlyBudget - total,
      avgPerActiveDay: Math.round(total / activeDates),
      topCategory: topCategoryEntry ? topCategoryEntry[0] : "-",
      topCategoryAmount: topCategoryEntry ? topCategoryEntry[1] : 0,
    };
  }, [expenses, monthlyBudget]);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((e) => {
      if (selectedCategory !== "전체" && e.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.memo && e.memo.toLowerCase().includes(q))
      );
    });
  }, [expenses, selectedCategory, searchQuery]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, ExpenseItem[]> = {};
    for (const item of filteredExpenses) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items,
        subtotal: items.reduce((s, it) => s + it.amount, 0),
      }));
  }, [filteredExpenses]);

  const startEdit = (item: ExpenseItem) => {
    setEditingId(item.id);
    setEditDraft({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = () => {
    if (!editDraft) return;
    if (!editDraft.title.trim() || editDraft.amount <= 0) return;
    onUpdateExpense({
      ...editDraft,
      title: editDraft.title.trim(),
      amount: Math.round(editDraft.amount),
      memo: editDraft.memo?.trim() || undefined,
    });
    setEditingId(null);
    setEditDraft(null);
  };

  const budgetUsagePct =
    monthlyBudget > 0 ? Math.min(100, Math.round((summary.total / monthlyBudget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
        <div className="md:col-span-4 bg-slate-100 relative min-h-[168px]">
          {imageError ? (
            <div className="w-full h-full min-h-[168px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-emerald-50 text-slate-600 p-4">
              <BookOpen className="w-7 h-7 text-emerald-700" />
              <span className="text-xs font-medium">스마트 소비 가계부</span>
            </div>
          ) : (
            <img
              src="/src/assets/images/ledger_finance_illustration_1795412760257.jpg"
              alt="날짜별 지출 내역과 영수증을 정리하는 가계부 노트"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-44 md:h-full object-cover"
            />
          )}
        </div>

        <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-emerald-700">
                {formatMonthLabel(selectedMonth)} 목표 예산 관리
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                이번 달 목표 예산{" "}
                <span className="font-mono-num">{formatKrw(monthlyBudget)}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                목표 예산을 직접 설정하면 과소비 여부와 남은 가용 금액이 실시간으로 계산됩니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!budgetEditing && (
                <button
                  type="button"
                  onClick={() => setBudgetEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>목표 예산 설정</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenBudgetSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>카테고리별 예산</span>
              </button>
            </div>
          </div>

          {budgetEditing ? (
            <form
              onSubmit={handleSaveMonthlyBudget}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustBudgetDraft(-10000)}
                  className="px-2.5 py-1.5 text-xs font-mono-num font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  -1만
                </button>
                <button
                  type="button"
                  onClick={() => adjustBudgetDraft(-100)}
                  className="px-2.5 py-1.5 text-xs font-mono-num font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  -100
                </button>
                <input
                  type="number"
                  min={100}
                  step={100}
                  aria-label="월 목표 예산 입력"
                  value={budgetDraft}
                  onChange={(e) => setBudgetDraft(e.target.value)}
                  className="w-36 px-3 py-1.5 text-sm font-mono-num font-semibold text-right text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => adjustBudgetDraft(100)}
                  className="px-2.5 py-1.5 text-xs font-mono-num font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => adjustBudgetDraft(10000)}
                  className="px-2.5 py-1.5 text-xs font-mono-num font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  +1만
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBudgetEditing(false);
                    setBudgetDraft(String(monthlyBudget));
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  현재 사용 <span className="font-mono-num font-semibold text-slate-900">{formatKrw(summary.total)}</span>
                  {budgetSavedMsg && (
                    <span className="ml-2 text-emerald-700 font-semibold">· 목표 예산이 저장되었습니다</span>
                  )}
                </span>
                <span
                  className={`font-mono-num font-semibold ${
                    summary.remaining < 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {summary.remaining >= 0
                    ? `${formatKrw(summary.remaining)} 남음 (${budgetUsagePct}% 사용)`
                    : `${formatKrw(Math.abs(summary.remaining))} 초과 (${budgetUsagePct}%)`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    summary.remaining < 0
                      ? "bg-rose-600"
                      : budgetUsagePct >= 85
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${Math.min(100, budgetUsagePct)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">{formatMonthLabel(selectedMonth)} 총 지출</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatKrw(summary.total)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono-num">총 {expenses.length}건 기록됨</div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              {summary.remaining >= 0 ? "목표 예산 잔여" : "목표 예산 초과"}
            </span>
            <button
              type="button"
              onClick={() => setBudgetEditing(true)}
              className="text-[11px] font-medium text-emerald-700 hover:underline whitespace-nowrap shrink-0"
            >
              예산 변경
            </button>
          </div>
          <div
            className={`mt-1.5 text-2xl font-bold font-mono-num ${
              summary.remaining >= 0 ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {summary.remaining >= 0 ? formatKrw(summary.remaining) : `+${formatKrw(Math.abs(summary.remaining))}`}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono-num">
            월 예산 {formatKrw(monthlyBudget)} 기준
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">지출일 평균 소비액</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-slate-900">
            {formatKrw(summary.avgPerActiveDay)}
          </div>
          <div className="mt-1 text-xs text-slate-500">실제 지출 발생일 기준</div>
        </div>

        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">최다 지출 카테고리</div>
            <div className="mt-1.5 text-xl font-bold text-slate-900 truncate">{summary.topCategory}</div>
            <div className="mt-1 text-xs text-slate-500 font-mono-num">
              {summary.topCategoryAmount > 0 ? formatKrw(summary.topCategoryAmount) : "내역 없음"}
            </div>
          </div>
        </div>
      </section>

      <ExpenseForm
        selectedMonth={selectedMonth}
        onAddExpense={onAddExpense}
        onAddMultipleExpenses={onAddMultipleExpenses}
      />

      <SpendingCharts
        expenses={expenses}
        selectedMonth={selectedMonth}
        categoryBudgets={categoryBudgets}
      />

      <section className="bg-white border border-slate-200 rounded-xl">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">날짜별 지출 내역</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              항목 수정 또는 삭제 후 상단의 AI 소비 분석을 실행하면 최신 소비 습관 리포트를 받을 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportExpensesToCsv(expenses, selectedMonth)}
              disabled={expenses.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 내보내기</span>
            </button>

            <button
              type="button"
              onClick={onRestoreSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>샘플 데이터 복원</span>
            </button>

            {confirmClear ? (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClearMonth();
                    setConfirmClear(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  정말 비우기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={expenses.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-white border border-slate-200 hover:bg-rose-50 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>이번 달 비우기</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="지출 내역, 메모 검색..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("전체")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === "전체"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              전체
            </button>
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {groupedByDate.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              {expenses.length === 0
                ? `${formatMonthLabel(selectedMonth)}에 기록된 지출 내역이 없습니다.`
                : "검색 및 필터 조건에 맞는 지출 내역이 없습니다."}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              상단 입력창에서 날짜와 가격을 입력하거나, 샘플 데이터를 불러와 AI 분석을 체험해 보세요.
            </p>
            {expenses.length === 0 && (
              <button
                type="button"
                onClick={onRestoreSample}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>샘플 가계부 불러오기</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {groupedByDate.map((group) => (
              <div key={group.date}>
                <div className="px-5 py-2.5 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 font-mono-num">
                    {formatDateWithDay(group.date)}
                  </span>
                  <span className="font-mono-num font-semibold text-slate-700">
                    일 합계 {formatKrw(group.subtotal)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => {
                    const isEditing = editingId === item.id && editDraft !== null;
                    if (isEditing && editDraft) {
                      return (
                        <div
                          key={item.id}
                          className="px-5 py-3 bg-emerald-50/40 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <input
                            type="date"
                            value={editDraft.date}
                            onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                            className="sm:col-span-2 px-2 py-1 text-xs font-mono-num bg-white border border-slate-300 rounded"
                          />
                          <select
                            value={editDraft.category}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, category: e.target.value as ExpenseCategory })
                            }
                            className="sm:col-span-2 px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editDraft.title}
                            onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                            className="sm:col-span-3 px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                          />
                          <div className="sm:col-span-3 flex items-center">
                            <button
                              type="button"
                              onClick={() =>
                                setEditDraft({
                                  ...editDraft,
                                  amount: Math.max(100, editDraft.amount - 100),
                                })
                              }
                              aria-label="100원 빼기"
                              className="px-1.5 py-1 text-[11px] font-mono-num text-slate-700 bg-slate-100 hover:bg-slate-200 border border-r-0 border-slate-300 rounded-l"
                            >
                              -100
                            </button>
                            <input
                              type="number"
                              min={100}
                              step={100}
                              value={editDraft.amount}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, amount: Number(e.target.value) || 0 })
                              }
                              className="w-full min-w-0 px-2 py-1 text-xs font-mono-num text-right bg-white border border-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditDraft({
                                  ...editDraft,
                                  amount: editDraft.amount + 100,
                                })
                              }
                              aria-label="100원 더하기"
                              className="px-1.5 py-1 text-[11px] font-mono-num text-slate-700 bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-300 rounded-r"
                            >
                              +100
                            </button>
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={saveEdit}
                              aria-label="수정 저장"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              aria-label="수정 취소"
                              className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-3">
                          <SpotThumbnail category={item.category} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: CATEGORY_BAR_HEX[item.category] }}
                                aria-hidden="true"
                              />
                              <span className="text-sm font-medium text-slate-900 truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                              <span>{item.category}</span>
                              {item.memo && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="truncate">{item.memo}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold font-mono-num text-slate-900">
                            {formatKrw(item.amount)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              aria-label={`${item.title} 수정`}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteExpense(item.id)}
                              aria-label={`${item.title} 삭제`}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {expenses.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-600">
              입력된 {expenses.length}건의 지출 내역을 바탕으로 과소비 구간과 이번 달 절약 가능 금액을 계산할 수 있습니다.
            </span>
            <button
              type="button"
              onClick={onGoToAnalysis}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              AI 소비 분석 리포트 보기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
