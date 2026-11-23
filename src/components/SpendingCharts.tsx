import { useMemo, useState } from "react";
import { ExpenseCategory, ExpenseItem } from "../types";
import { CATEGORY_BAR_HEX, formatKrw } from "../utils/format";
import { SpotThumbnail } from "./SpotThumbnail";

interface SpendingChartsProps {
  expenses: ExpenseItem[];
  selectedMonth: string;
  categoryBudgets: Record<ExpenseCategory, number>;
}

export function SpendingCharts({ expenses, selectedMonth, categoryBudgets }: SpendingChartsProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const { dailySeries, maxDaily, avgDaily, categoryStats, totalSpent } = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split("-");
    const year = Number(yStr) || 2026;
    const month = Number(mStr) || 11;
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayTotals: Record<string, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      dayTotals[key] = 0;
    }

    const catMap: Record<string, number> = {};
    let total = 0;

    for (const exp of expenses) {
      total += exp.amount;
      if (exp.date.startsWith(selectedMonth) && dayTotals[exp.date] !== undefined) {
        dayTotals[exp.date] += exp.amount;
      }
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;
    }

    const series = Object.entries(dayTotals).map(([date, amount]) => ({
      date,
      dayNum: Number(date.slice(-2)),
      amount,
    }));

    const activeDays = series.filter((s) => s.amount > 0).length || 1;
    const maxD = Math.max(10000, ...series.map((s) => s.amount));

    const cats = Object.entries(catMap)
      .map(([category, amount]) => {
        const cap = categoryBudgets[category as ExpenseCategory] || 0;
        const share = total > 0 ? Math.round((amount / total) * 1000) / 10 : 0;
        return {
          category: category as ExpenseCategory,
          amount,
          cap,
          isOverCap: cap > 0 && amount > cap,
          share,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      dailySeries: series,
      maxDaily: maxD,
      avgDaily: Math.round(total / activeDays),
      categoryStats: cats,
      totalSpent: total,
    };
  }, [expenses, selectedMonth, categoryBudgets]);

  const hoveredItem = dailySeries.find((d) => d.date === hoveredDay);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">일별 지출 흐름</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              지출 발생일 기준 일 평균 <span className="font-mono-num font-semibold text-slate-800">{formatKrw(avgDaily)}</span>
            </p>
          </div>
          <div className="text-right min-h-[34px]">
            {hoveredItem ? (
              <div>
                <div className="text-xs text-slate-500 font-mono-num">{hoveredItem.date}</div>
                <div className="text-sm font-semibold font-mono-num text-slate-900">
                  {formatKrw(hoveredItem.amount)}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">막대에 마우스를 올려 날짜별 금액 확인</span>
            )}
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            지출을 입력하면 일별 소비 그래프가 표시됩니다.
          </div>
        ) : (
          <div className="pt-2">
            <div className="relative h-44 flex items-end gap-[3px] border-b border-slate-200 pb-1">
              {avgDaily > 0 && (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-amber-500/70 pointer-events-none"
                  style={{ bottom: `${Math.min(100, (avgDaily / maxDaily) * 100)}%` }}
                />
              )}
              {dailySeries.map((item) => {
                const heightPct = item.amount > 0 ? Math.max(4, (item.amount / maxDaily) * 100) : 0;
                const isHigh = item.amount > avgDaily * 1.6;
                const isHovered = hoveredDay === item.date;

                return (
                  <button
                    key={item.date}
                    type="button"
                    onMouseEnter={() => setHoveredDay(item.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onFocus={() => setHoveredDay(item.date)}
                    onBlur={() => setHoveredDay(null)}
                    aria-label={`${item.date} 지출 ${formatKrw(item.amount)}`}
                    className="flex-1 h-full flex items-end justify-center group focus:outline-none"
                  >
                    <div
                      className={`w-full rounded-t-[2px] transition-colors ${
                        item.amount === 0
                          ? "bg-slate-100 h-[2px]"
                          : isHovered
                          ? "bg-slate-900"
                          : isHigh
                          ? "bg-rose-500"
                          : "bg-emerald-600/80"
                      }`}
                      style={item.amount > 0 ? { height: `${heightPct}%` } : undefined}
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] font-mono-num text-slate-400 mt-1.5">
              <span>1일</span>
              <span>10일</span>
              <span>20일</span>
              <span>{dailySeries.length}일</span>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">카테고리별 지출 비중</h3>
          <span className="text-xs font-mono-num text-slate-500">총 {formatKrw(totalSpent)}</span>
        </div>

        {categoryStats.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            표시할 카테고리 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {categoryStats.slice(0, 6).map((cat) => {
              const barColor = cat.isOverCap ? "#DC2626" : CATEGORY_BAR_HEX[cat.category];
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <SpotThumbnail category={cat.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                        <span>{cat.category}</span>
                        {cat.isOverCap && (
                          <span className="text-[11px] font-semibold text-rose-600">· 예산 초과</span>
                        )}
                      </span>
                      <span className="font-mono-num text-slate-700 shrink-0 ml-2">
                        {formatKrw(cat.amount)}{" "}
                        <span className="text-slate-400">({cat.share}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          width: `${Math.max(3, cat.share)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
