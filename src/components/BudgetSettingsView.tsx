import { Check, RotateCcw } from "lucide-react";
import { FormEvent, useState } from "react";
import { EXPENSE_CATEGORIES, ExpenseCategory, ExpenseItem } from "../types";
import { formatKrw } from "../utils/format";
import { SpotThumbnail } from "./SpotThumbnail";

interface BudgetSettingsViewProps {
  monthlyBudget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
  expenses: ExpenseItem[];
  onSaveBudgets: (monthly: number, categories: Record<ExpenseCategory, number>) => void;
  onResetDefaults: () => void;
}

export function BudgetSettingsView({
  monthlyBudget,
  categoryBudgets,
  expenses,
  onSaveBudgets,
  onResetDefaults,
}: BudgetSettingsViewProps) {
  const [monthlyDraft, setMonthlyDraft] = useState(String(monthlyBudget));
  const [categoryDrafts, setCategoryDrafts] = useState<Record<ExpenseCategory, string>>(() => {
    const init = {} as Record<ExpenseCategory, string>;
    for (const cat of EXPENSE_CATEGORIES) {
      init[cat] = String(categoryBudgets[cat] ?? 0);
    }
    return init;
  });
  const [savedNotice, setSavedNotice] = useState(false);

  const spentByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const categorySum = EXPENSE_CATEGORIES.reduce(
    (s, cat) => s + (Number(categoryDrafts[cat]) || 0),
    0
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextMonthly = Math.max(10000, Math.round(Number(monthlyDraft) || monthlyBudget));
    const nextCats = {} as Record<ExpenseCategory, number>;
    for (const cat of EXPENSE_CATEGORIES) {
      nextCats[cat] = Math.max(0, Math.round(Number(categoryDrafts[cat]) || 0));
    }
    onSaveBudgets(nextMonthly, nextCats);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleApplyDefaults = () => {
    onResetDefaults();
    setMonthlyDraft("1200000");
    setCategoryDrafts({
      "식비": "220000",
      "배달·외식": "180000",
      "카페·간식": "70000",
      "쇼핑·의류": "150000",
      "생활·마트": "140000",
      "교통·차량": "100000",
      "구독·통신": "90000",
      "문화·여가": "100000",
      "건강·의료": "80000",
      "기타": "70000",
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <SpotThumbnail category="예산" size="lg" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">월 목표 예산 설정</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                전체 월 예산과 카테고리별 상한선을 설정하면 초과 지출 경고가 자동으로 반영됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본값 되돌리기</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>예산 저장</span>
            </button>
          </div>
        </div>

        <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label htmlFor="monthly-budget-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              이번 달 전체 목표 예산 (100원 단위 조절 가능)
            </label>
            <div className="flex items-center max-w-sm">
              <button
                type="button"
                onClick={() =>
                  setMonthlyDraft((prev) => String(Math.max(100, (Number(prev) || 0) - 10000)))
                }
                className="px-2.5 h-[44px] text-xs font-mono-num font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-r-0 border-slate-200 rounded-l-lg transition-colors whitespace-nowrap shrink-0"
              >
                -1만
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthlyDraft((prev) => String(Math.max(100, (Number(prev) || 0) - 100)))
                }
                className="px-2.5 h-[44px] text-xs font-mono-num font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-r-0 border-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                -100
              </button>
              <input
                id="monthly-budget-input"
                type="number"
                min={100}
                step={100}
                value={monthlyDraft}
                onChange={(e) => setMonthlyDraft(e.target.value)}
                className="w-full min-w-0 px-3 py-2.5 text-base font-bold font-mono-num text-right text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 h-[44px]"
              />
              <button
                type="button"
                onClick={() => setMonthlyDraft((prev) => String((Number(prev) || 0) + 100))}
                className="px-2.5 h-[44px] text-xs font-mono-num font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => setMonthlyDraft((prev) => String((Number(prev) || 0) + 10000))}
                className="px-2.5 h-[44px] text-xs font-mono-num font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 rounded-r-lg transition-colors whitespace-nowrap shrink-0"
              >
                +1만
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between">
              <span>카테고리별 예산 합계</span>
              <span className="font-mono-num font-semibold text-slate-900">{formatKrw(categorySum)}</span>
            </div>
            <div className="flex justify-between">
              <span>전체 월 목표 예산</span>
              <span className="font-mono-num font-semibold text-slate-900">
                {formatKrw(Number(monthlyDraft) || 0)}
              </span>
            </div>
            {savedNotice && (
              <div className="pt-1 text-emerald-700 font-semibold">설정이 저장되었습니다.</div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">카테고리별 적정 예산 및 현재 소진율</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {EXPENSE_CATEGORIES.map((cat) => {
            const cap = Number(categoryDrafts[cat]) || 0;
            const spent = spentByCategory[cat] || 0;
            const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
            const isOver = cap > 0 && spent > cap;

            return (
              <div
                key={cat}
                className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                <div className="md:col-span-3 flex items-center gap-3">
                  <SpotThumbnail category={cat} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{cat}</div>
                    <div className="text-xs font-mono-num text-slate-500 mt-0.5">
                      현재 사용 {formatKrw(spent)}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isOver ? "text-rose-600 font-semibold" : "text-slate-500"}>
                      {isOver ? `${formatKrw(spent - cap)} 초과` : `${pct}% 사용`}
                    </span>
                    <span className="font-mono-num text-slate-500">{formatKrw(cap)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOver ? "bg-rose-600" : pct >= 85 ? "bg-amber-500" : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryDrafts((prev) => ({
                          ...prev,
                          [cat]: String(Math.max(0, (Number(prev[cat]) || 0) - 100)),
                        }))
                      }
                      aria-label={`${cat} 100원 빼기`}
                      className="px-2 py-1.5 text-xs font-mono-num text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                    >
                      -100
                    </button>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      aria-label={`${cat} 월 예산`}
                      value={categoryDrafts[cat]}
                      onChange={(e) =>
                        setCategoryDrafts((prev) => ({ ...prev, [cat]: e.target.value }))
                      }
                      className="w-32 px-3 py-1.5 text-sm font-mono-num text-right text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryDrafts((prev) => ({
                          ...prev,
                          [cat]: String((Number(prev[cat]) || 0) + 100),
                        }))
                      }
                      aria-label={`${cat} 100원 더하기`}
                      className="px-2 py-1.5 text-xs font-mono-num text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                    >
                      +100
                    </button>
                    <span className="text-xs text-slate-500">원</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </form>
  );
}
