import { Plus, FileText, Loader2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { EXPENSE_CATEGORIES, ExpenseCategory, ExpenseItem } from "../types";

interface ExpenseFormProps {
  selectedMonth: string;
  onAddExpense: (item: Omit<ExpenseItem, "id">) => void;
  onAddMultipleExpenses: (items: Omit<ExpenseItem, "id">[]) => void;
}

export function ExpenseForm({ selectedMonth, onAddExpense, onAddMultipleExpenses }: ExpenseFormProps) {
  const defaultDate =
    selectedMonth === "2026-11" ? "2026-11-22" : `${selectedMonth}-01`;

  const [date, setDate] = useState(defaultDate);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("식비");
  const [amountInput, setAmountInput] = useState("");
  const [memo, setMemo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Number(amountInput.replace(/,/g, "").trim());
    if (!date) {
      setFormError("날짜를 선택해 주세요.");
      return;
    }
    if (!title.trim()) {
      setFormError("지출 내역(사용처)을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("올바른 지출 금액(1원 이상)을 입력해 주세요.");
      return;
    }

    onAddExpense({
      date,
      title: title.trim(),
      category,
      amount: Math.round(parsedAmount),
      memo: memo.trim() || undefined,
    });

    setTitle("");
    setAmountInput("");
    setMemo("");
  };

  const handleQuickAddAmount = (delta: number) => {
    const current = Number(amountInput.replace(/,/g, "").trim()) || 0;
    const next = Math.max(0, current + delta);
    setAmountInput(next === 0 ? "" : String(next));
  };

  const handleBulkParse = async () => {
    if (!bulkText.trim()) {
      setBulkError("가계부 메모나 카드 내역 텍스트를 입력해 주세요.");
      return;
    }
    setBulkLoading(true);
    setBulkError(null);

    try {
      const res = await fetch("/api/parse-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: bulkText,
          defaultDate: date,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "내역 변환에 실패했습니다.");
      }

      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("추출된 지출 항목이 없습니다. 항목명과 금액을 포함해 주세요.");
      }

      const validItems: Omit<ExpenseItem, "id">[] = data.items
        .filter((it: { title?: string; amount?: number }) => it.title && Number(it.amount) > 0)
        .map((it: { date?: string; title: string; amount: number; category?: string; memo?: string }) => ({
          date: it.date && /^\d{4}-\d{2}-\d{2}$/.test(it.date) ? it.date : date,
          title: String(it.title).trim(),
          amount: Math.round(Number(it.amount)),
          category: (EXPENSE_CATEGORIES.includes(it.category as ExpenseCategory)
            ? it.category
            : "기타") as ExpenseCategory,
          memo: it.memo ? String(it.memo).trim() : undefined,
        }));

      onAddMultipleExpenses(validItems);
      setBulkText("");
      setBulkOpen(false);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "변환 중 오류가 발생했습니다.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">날짜별 지출 입력</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100원 단위로 금액을 세밀하게 조절하여 날짜·항목별로 기록할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBulkOpen((prev) => !prev);
            setBulkError(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {bulkOpen ? <X className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          <span>{bulkOpen ? "개별 입력으로 닫기" : "메모/문자 여러 건 붙여넣기"}</span>
        </button>
      </div>

      {bulkOpen ? (
        <div className="space-y-3 pt-1">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            placeholder={`예시:\n11월 20일 저녁 족발 배달 36,000원\n11월 21일 스타벅스 라떼 5,500원, 다이소 생필품 12,000원\n오늘 점심 제육볶음 10,000원`}
            className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
          {bulkError && <p className="text-xs text-rose-600 font-medium">{bulkError}</p>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              날짜가 빠진 줄은 좌측 기준 날짜({date})로 자동 정리됩니다.
            </span>
            <button
              type="button"
              onClick={handleBulkParse}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {bulkLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{bulkLoading ? "내역 추출 중..." : "자동 정리 후 추가"}</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-2">
              <label htmlFor="exp-date" className="block text-xs font-medium text-slate-600 mb-1">
                날짜
              </label>
              <input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="exp-category" className="block text-xs font-medium text-slate-600 mb-1">
                카테고리
              </label>
              <select
                id="exp-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="exp-title" className="block text-xs font-medium text-slate-600 mb-1">
                지출 내역
              </label>
              <input
                id="exp-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 배달의민족 떡볶이, 카페"
                className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="exp-amount" className="block text-xs font-medium text-slate-600 mb-1">
                금액 (100원 단위 조절)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleQuickAddAmount(-100)}
                  aria-label="100원 빼기"
                  className="px-2.5 h-[38px] text-xs font-mono-num font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-r-0 border-slate-200 rounded-l-lg transition-colors whitespace-nowrap shrink-0"
                >
                  -100
                </button>
                <input
                  id="exp-amount"
                  type="number"
                  min={0}
                  step={100}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="15000"
                  className="w-full min-w-0 px-2.5 py-2 text-sm font-mono-num text-right text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 h-[38px]"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddAmount(100)}
                  aria-label="100원 더하기"
                  className="px-2.5 h-[38px] text-xs font-mono-num font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 rounded-r-lg transition-colors whitespace-nowrap shrink-0"
                >
                  +100
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>지출 추가</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택: 야식 주문, 세일 충동구매 등)"
                className="w-full max-w-md px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">단위 조절</span>
              {[
                { label: "-500", val: -500 },
                { label: "+100", val: 100 },
                { label: "+500", val: 500 },
                { label: "+1천", val: 1000 },
                { label: "+5천", val: 5000 },
                { label: "+1만", val: 10000 },
                { label: "+5만", val: 50000 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => handleQuickAddAmount(btn.val)}
                  className="px-2.5 py-1 text-xs font-mono-num text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="text-xs font-medium text-rose-600">{formError}</p>}
        </form>
      )}
    </section>
  );
}
