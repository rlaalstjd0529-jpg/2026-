import { AlertTriangle, ArrowRight, CheckSquare, Loader2, RefreshCw, Square } from "lucide-react";
import { useMemo } from "react";
import { AiAnalysisResponse } from "../types";
import { formatKrw, formatMonthLabel, formatWonSymbol } from "../utils/format";
import { SpotThumbnail } from "./SpotThumbnail";

interface AiAnalysisViewProps {
  selectedMonth: string;
  expenseCount: number;
  totalSpent: number;
  analysisResult: AiAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  checkedStrategies: string[];
  onToggleStrategy: (title: string) => void;
  onRunAnalysis: () => void;
  onGoToLedger: () => void;
}

export function AiAnalysisView({
  selectedMonth,
  expenseCount,
  totalSpent,
  analysisResult,
  isLoading,
  error,
  hasUnsavedChanges,
  checkedStrategies,
  onToggleStrategy,
  onRunAnalysis,
  onGoToLedger,
}: AiAnalysisViewProps) {
  const analysis = analysisResult?.analysis;

  const selectedSavingSum = useMemo(() => {
    if (!analysis) return 0;
    return analysis.savingStrategies
      .filter((s) => checkedStrategies.includes(s.title))
      .reduce((sum, s) => sum + s.expectedMonthlySaving, 0);
  }, [analysis, checkedStrategies]);

  const saveableRatio = useMemo(() => {
    if (!analysis || !analysisResult?.stats.totalSpent) return 0;
    return Math.min(
      100,
      Math.round((analysis.monthlySaveableAmount / analysisResult.stats.totalSpent) * 100)
    );
  }, [analysis, analysisResult]);

  if (expenseCount === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          먼저 {formatMonthLabel(selectedMonth)} 지출 내역을 입력해 주세요
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
          가계부에 날짜별 지출 목록과 가격을 기록하면 AI가 소비 습관, 과소비 영역, 맞춤 절약 방안, 그리고 이번 달 절약 가능 금액을 정확하게 분석해 드립니다.
        </p>
        <button
          type="button"
          onClick={onGoToLedger}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>가계부 입력하러 가기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatMonthLabel(selectedMonth)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">지출 {expenseCount}건</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">총 {formatKrw(totalSpent)}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">AI 소비 습관 및 절약 리포트</h2>
          {analysisResult && (
            <p className="text-xs text-slate-500 mt-0.5 font-mono-num">
              마지막 분석: {new Date(analysisResult.analyzedAt).toLocaleString("ko-KR")}
              {hasUnsavedChanges ? " · 내역이 변경되어 재분석이 필요합니다" : ""}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>소비 패턴 정밀 분석 중...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>{analysis ? "최신 내역으로 다시 분석" : "AI 소비 분석 시작하기"}</span>
            </>
          )}
        </button>
      </section>

      {error && (
        <section className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-900">AI 분석 요청을 완료하지 못했습니다</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRunAnalysis}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            다시 시도
          </button>
        </section>
      )}

      {isLoading && (
        <div className="space-y-4" aria-busy="true" aria-label="분석 결과 불러오는 중">
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse space-y-3">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-10 w-64 bg-slate-200 rounded" />
            <div className="h-4 w-full max-w-2xl bg-slate-100 rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 h-48 animate-pulse" />
            <div className="bg-white border border-slate-200 rounded-xl p-6 h-48 animate-pulse" />
          </div>
        </div>
      )}

      {!isLoading && !analysis && !error && (
        <section className="bg-white border border-slate-200 rounded-xl p-8">
          <div className="max-w-3xl">
            <h3 className="text-base font-semibold text-slate-900">분석을 실행하면 확인할 수 있는 항목</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <SpotThumbnail category="절약" size="md" />
                <div>
                  <div className="font-semibold text-slate-900">01. 이번 달 절약 가능 금액</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    반복 지출과 불필요 소비를 합산해 현실적으로 줄일 수 있는 금액을 원 단위로 계산합니다.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <SpotThumbnail category="배달·외식" size="md" />
                <div>
                  <div className="font-semibold text-slate-900">02. 과소비 구간 및 원인 항목</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    어느 카테고리에서 적정 기준을 초과했는지 실제 결제 항목을 짚어 알려드립니다.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <SpotThumbnail category="카페·간식" size="md" />
                <div>
                  <div className="font-semibold text-slate-900">03. 나의 소비 습관 진단</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    야간 배달, 주말 몰아 쓰기, 소액 반복 결제 등 날짜 데이터 기반 행동 패턴을 파악합니다.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <SpotThumbnail category="쇼핑·의류" size="md" />
                <div>
                  <div className="font-semibold text-slate-900">04. 맞춤 절약 방안 및 실천 리스트</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    난이도별 절약 전략과 예상 월 절감액을 제안하고 실천 여부를 체크할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {!isLoading && analysis && (
        <>
          <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex items-center gap-4">
              <SpotThumbnail category="절약" size="lg" className="border-slate-700" />
              <div>
                <div className="text-xs font-medium text-emerald-300">
                  {formatMonthLabel(selectedMonth)} 예상 절약 가능 금액
                </div>
                <div className="mt-1.5 text-3xl sm:text-4xl font-bold font-mono-num tracking-tight">
                  {formatWonSymbol(analysis.monthlySaveableAmount)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono-num">
                  <span>총 지출 대비 {saveableRatio}% 절감 가능</span>
                  <span aria-hidden="true">·</span>
                  <span>소비 성향: {analysis.spendingPersona}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:border-l lg:border-slate-700/80 lg:pl-6 space-y-2">
              <p className="text-base font-semibold text-white leading-snug">
                {analysis.headlineSummary}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {analysis.saveableBasis}
              </p>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">어디서 과소비하고 있나요?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  적정 권장 상한선 대비 초과 지출이 발생한 영역과 주요 원인 항목입니다.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {analysis.overspendingAreas.map((area) => {
                const overPct =
                  area.recommendedCap > 0
                    ? Math.round(((area.spentAmount - area.recommendedCap) / area.recommendedCap) * 100)
                    : 0;
                return (
                  <div key={area.category} className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    <div className="lg:col-span-4 flex items-start gap-3">
                      <SpotThumbnail category={area.category} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900">{area.category}</span>
                          <span className="text-xs font-semibold font-mono-num text-rose-600">
                            +{formatKrw(area.excessAmount)} 초과 ({overPct > 0 ? `+${overPct}%` : "과다"})
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono-num">
                          <span>실제 지출 {formatKrw(area.spentAmount)}</span>
                          <span>적정 기준 {formatKrw(area.recommendedCap)}</span>
                        </div>
                        <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-rose-600"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((area.spentAmount / Math.max(1, area.spentAmount)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-1.5">
                      <p className="text-sm text-slate-700 leading-relaxed">{area.reason}</p>
                      {area.triggerItems.length > 0 && (
                        <p className="text-xs text-slate-500">
                          주요 원인 내역: <span className="text-slate-800 font-medium">{area.triggerItems.join(" · ")}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">내 소비 습관 진단</h3>
                <p className="text-xs text-slate-500 mt-0.5">날짜·항목 데이터에서 포착된 반복 행동 패턴</p>
              </div>
              <div className="divide-y divide-slate-100">
                {analysis.habitAnalysis.map((habit, idx) => (
                  <div key={idx} className="p-5 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        0{idx + 1}. {habit.title}
                      </h4>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap shrink-0 ${
                          habit.impactLevel === "높음"
                            ? "text-rose-600"
                            : habit.impactLevel === "보통"
                            ? "text-amber-700"
                            : "text-slate-500"
                        }`}
                      >
                        영향도 {habit.impactLevel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{habit.patternDetail}</p>
                    <p className="text-xs text-slate-500 font-mono-num">근거 내역: {habit.evidenceDates}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">맞춤 절약 방안 추천</h3>
                    <p className="text-xs text-slate-500 mt-0.5">실천할 항목을 체크해 목표 절감액을 계산해 보세요</p>
                  </div>
                  {selectedSavingSum > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500">선택 목표</div>
                      <div className="text-sm font-bold font-mono-num text-emerald-700">
                        -{formatKrw(selectedSavingSum)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {analysis.savingStrategies.map((strategy) => {
                    const checked = checkedStrategies.includes(strategy.title);
                    return (
                      <button
                        key={strategy.title}
                        type="button"
                        onClick={() => onToggleStrategy(strategy.title)}
                        className={`w-full text-left p-5 transition-colors flex items-start gap-3 ${
                          checked ? "bg-emerald-50/50" : "hover:bg-slate-50"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                checked ? "text-emerald-950" : "text-slate-900"
                              }`}
                            >
                              {strategy.title}
                            </span>
                            <span className="text-xs font-bold font-mono-num text-emerald-700 whitespace-nowrap shrink-0">
                              월 {formatKrw(strategy.expectedMonthlySaving)} 절약
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {strategy.category} · 난이도 {strategy.difficulty}
                          </div>
                          <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {strategy.actionStep}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-800 mb-2">이번 주 바로 시작할 3가지</div>
                <ol className="space-y-1.5 text-xs text-slate-700">
                  {analysis.immediateActions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono-num font-semibold text-emerald-700 shrink-0">0{i + 1}.</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
