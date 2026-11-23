import { BarChart3, BookOpen, Calendar, SlidersHorizontal } from "lucide-react";
import { ActiveTab } from "../types";
import { formatKrw, formatMonthLabel } from "../utils/format";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  totalSpent: number;
  monthlyBudget: number;
  hasUnsavedAnalysisChanges: boolean;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  selectedMonth,
  availableMonths,
  onSelectMonth,
  totalSpent,
  monthlyBudget,
  hasUnsavedAnalysisChanges,
}: SidebarProps) {
  const usageRatio = monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;
  const isOverBudget = totalSpent > monthlyBudget;
  const remaining = monthlyBudget - totalSpent;

  const navItems: { id: ActiveTab; label: string; icon: typeof BookOpen }[] = [
    { id: "ledger", label: "가계부 · 지출 내역", icon: BookOpen },
    { id: "analysis", label: "AI 소비 분석 리포트", icon: BarChart3 },
    { id: "budget", label: "예산 · 카테고리 설정", icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-full lg:w-[260px] lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
      <div>
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab("ledger");
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            세이브노트
          </a>
        </div>

        <div className="p-4 border-b border-slate-100">
          <label htmlFor="month-select" className="block text-xs font-medium text-slate-500 mb-2">
            조회 월 선택
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto" aria-label="주 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === "analysis" && hasUnsavedAnalysisChanges && (
                  <span className={`text-[11px] font-medium ${active ? "text-emerald-300" : "text-amber-700"}`}>
                    갱신 필요
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block p-5 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600">{formatMonthLabel(selectedMonth)} 예산 소진율</span>
          <span
            className={`text-xs font-semibold font-mono-num ${
              isOverBudget ? "text-rose-600" : usageRatio >= 85 ? "text-amber-600" : "text-emerald-700"
            }`}
          >
            {usageRatio}%
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-sm overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-300 ${
              isOverBudget ? "bg-rose-600" : usageRatio >= 85 ? "bg-amber-500" : "bg-emerald-600"
            }`}
            style={{ width: `${Math.min(100, usageRatio)}%` }}
          />
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>사용 금액</span>
            <span className="font-mono-num font-semibold text-slate-900">{formatKrw(totalSpent)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>목표 예산</span>
            <button
              type="button"
              onClick={() => onSelectTab("budget")}
              className="font-mono-num text-slate-700 hover:text-emerald-700 underline underline-offset-2 transition-colors"
            >
              {formatKrw(monthlyBudget)}
            </button>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-600">{remaining >= 0 ? "남은 예산" : "예산 초과"}</span>
            <span
              className={`font-mono-num font-semibold ${
                remaining >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {formatKrw(Math.abs(remaining))}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
