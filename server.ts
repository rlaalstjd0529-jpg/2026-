import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

interface ExpenseInput {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  memo?: string;
}

interface AnalyzeRequestBody {
  month: string;
  monthlyBudget: number;
  categoryBudgets?: Record<string, number>;
  expenses: ExpenseInput[];
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function extractErrorMessage(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === "MISSING_API_KEY") {
    return {
      status: 500,
      message: "GEMINI_API_KEY가 설정되지 않았습니다. Settings > Secrets 패널에서 API 키를 확인해 주세요.",
    };
  }
  if (raw.includes("403") || raw.includes("PERMISSION_DENIED") || raw.includes("API_KEY_INVALID")) {
    return {
      status: 403,
      message: "Gemini API 키 인증에 실패했습니다. Settings > Secrets 패널에서 유효한 키를 확인해 주세요.",
    };
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  return {
    status: 500,
    message: `AI 분석 중 오류가 발생했습니다: ${raw}`,
  };
}

function buildSpendingStats(expenses: ExpenseInput[], monthlyBudget: number) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, { total: number; count: number }> = {};
  const byDayOfWeek: Record<string, { total: number; count: number }> = {
    일: { total: 0, count: 0 },
    월: { total: 0, count: 0 },
    화: { total: 0, count: 0 },
    수: { total: 0, count: 0 },
    목: { total: 0, count: 0 },
    금: { total: 0, count: 0 },
    토: { total: 0, count: 0 },
  };
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  let weekendTotal = 0;
  let weekdayTotal = 0;
  const itemFrequency: Record<string, { count: number; total: number }> = {};

  for (const exp of expenses) {
    if (!byCategory[exp.category]) {
      byCategory[exp.category] = { total: 0, count: 0 };
    }
    byCategory[exp.category].total += exp.amount;
    byCategory[exp.category].count += 1;

    const d = new Date(`${exp.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const dow = dayNames[d.getDay()];
      byDayOfWeek[dow].total += exp.amount;
      byDayOfWeek[dow].count += 1;
      if (d.getDay() === 0 || d.getDay() === 6 || d.getDay() === 5) {
        if (d.getDay() === 0 || d.getDay() === 6) weekendTotal += exp.amount;
        else weekdayTotal += exp.amount;
      } else {
        weekdayTotal += exp.amount;
      }
    }

    const key = exp.title.trim();
    if (!itemFrequency[key]) {
      itemFrequency[key] = { count: 0, total: 0 };
    }
    itemFrequency[key].count += 1;
    itemFrequency[key].total += exp.amount;
  }

  const sortedCategories = Object.entries(byCategory)
    .map(([category, info]) => ({
      category,
      total: info.total,
      count: info.count,
      sharePercent: totalSpent > 0 ? Math.round((info.total / totalSpent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const repeatedItems = Object.entries(itemFrequency)
    .filter(([, v]) => v.count >= 2)
    .map(([title, v]) => ({ title, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total);

  const sortedExpenses = [...expenses].sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSpent,
    monthlyBudget,
    budgetDiff: monthlyBudget - totalSpent,
    transactionCount: expenses.length,
    averageTransaction: expenses.length > 0 ? Math.round(totalSpent / expenses.length) : 0,
    weekendTotal,
    weekdayTotal,
    sortedCategories,
    byDayOfWeek,
    repeatedItems,
    sortedExpenses,
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const body = req.body as AnalyzeRequestBody;
      if (!body || !Array.isArray(body.expenses) || body.expenses.length === 0) {
        res.status(400).json({ error: "분석할 지출 내역이 없습니다. 최소 1건 이상의 지출을 입력해 주세요." });
        return;
      }

      const sanitizedExpenses: ExpenseInput[] = body.expenses
        .filter((e) => e && typeof e.title === "string" && typeof e.amount === "number" && e.amount > 0)
        .map((e) => ({
          id: String(e.id || ""),
          date: String(e.date || "").slice(0, 10),
          title: e.title.trim().slice(0, 80),
          category: String(e.category || "기타").slice(0, 30),
          amount: Math.round(e.amount),
          memo: e.memo ? String(e.memo).trim().slice(0, 100) : undefined,
        }));

      if (sanitizedExpenses.length === 0) {
        res.status(400).json({ error: "유효한 지출 내역이 없습니다." });
        return;
      }

      const monthlyBudget = typeof body.monthlyBudget === "number" && body.monthlyBudget > 0 ? Math.round(body.monthlyBudget) : 1500000;
      const stats = buildSpendingStats(sanitizedExpenses, monthlyBudget);

      const ai = getAiClient();

      const prompt = `당신은 한국의 실전 개인 재무·소비습관 분석 전문가입니다.
아래 사용자의 ${body.month || "이번 달"} 가계부 지출 데이터를 면밀히 분석하여:
1. 사용자의 실제 소비 습관 패턴(요일, 빈도, 반복 소액 지출, 야식/배달, 충동구매 등)을 구체적 날짜와 내역을 인용해 진단하세요.
2. 어디서 과소비하고 있는지 카테고리 및 구체적 항목을 짚어주고, 적정 상한선 대비 초과 지출액을 산출하세요.
3. 현실적이고 실천 가능한 절약 방안을 구체적인 예상 월 절감액과 함께 제안하세요.
4. "이번 달 절약 가능 금액(monthlySaveableAmount)"을 산출하세요. 주의: 이 금액은 불필요/반복/과소비 지출에서 현실적으로 줄일 수 있는 합계여야 하며, 총 지출(${stats.totalSpent.toLocaleString()}원)보다 크거나 비현실적이어서는 안 됩니다. 또한 절약 방안들의 예상 절감액 합계와 논리적으로 일관되어야 합니다.

[집계 통계]
- 대상 월: ${body.month}
- 월 목표 예산: ${stats.monthlyBudget.toLocaleString()}원
- 현재 총 지출: ${stats.totalSpent.toLocaleString()}원 (${stats.transactionCount}건)
- 예산 대비 잔여/초과: ${stats.budgetDiff >= 0 ? `${stats.budgetDiff.toLocaleString()}원 남음` : `${Math.abs(stats.budgetDiff).toLocaleString()}원 초과`}
- 1회 평균 지출: ${stats.averageTransaction.toLocaleString()}원
- 평일 총 지출: ${stats.weekdayTotal.toLocaleString()}원 / 주말(토·일) 총 지출: ${stats.weekendTotal.toLocaleString()}원
- 카테고리별 예산 설정: ${JSON.stringify(body.categoryBudgets || {})}
- 카테고리별 집계: ${JSON.stringify(stats.sortedCategories)}
- 반복 지출 항목(2회 이상): ${JSON.stringify(stats.repeatedItems)}

[날짜별 전체 지출 목록]
${stats.sortedExpenses
  .map((e) => `${e.date} | ${e.category} | ${e.title} | ${e.amount.toLocaleString()}원${e.memo ? ` (${e.memo})` : ""}`)
  .join("\n")}

모든 금액은 원(KRW) 단위 정수(number)로 반환하고, 한국어로 명확하고 직설적이면서도 실용적인 조언을 작성하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a sharp, practical Korean personal finance analyst. Analyze exact ledger items, identify overspending objectively, avoid generic platitudes, and ensure all KRW numbers are mathematically consistent.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headlineSummary: {
                type: Type.STRING,
                description: "이번 달 소비 상태를 요약하는 핵심 1~2문장 총평",
              },
              spendingPersona: {
                type: Type.STRING,
                description: "사용자의 소비 성향을 나타내는 짧은 별칭 (예: 주말 배달·소액 카페 반복형)",
              },
              monthlySaveableAmount: {
                type: Type.INTEGER,
                description: "이번 달 불필요 지출을 줄였을 때 절약 가능한 예상 금액 (원, 정수)",
              },
              saveableBasis: {
                type: Type.STRING,
                description: "절약 가능 금액이 어떤 항목/카테고리 절감 합산에서 나왔는지 구체적 산출 근거",
              },
              habitAnalysis: {
                type: Type.ARRAY,
                description: "데이터에서 발견된 핵심 소비 습관 3~4가지",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    patternDetail: { type: Type.STRING },
                    impactLevel: { type: Type.STRING, enum: ["높음", "보통", "낮음"] },
                    evidenceDates: { type: Type.STRING, description: "근거가 된 실제 날짜 및 지출 내역 요약" },
                  },
                  required: ["title", "patternDetail", "impactLevel", "evidenceDates"],
                },
              },
              overspendingAreas: {
                type: Type.ARRAY,
                description: "과소비로 판단되는 카테고리/영역 Top 2~4개",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    spentAmount: { type: Type.INTEGER },
                    recommendedCap: { type: Type.INTEGER },
                    excessAmount: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                    triggerItems: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["category", "spentAmount", "recommendedCap", "excessAmount", "reason", "triggerItems"],
                },
              },
              savingStrategies: {
                type: Type.ARRAY,
                description: "구체적인 절약 방안 추천 3~5가지",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    expectedMonthlySaving: { type: Type.INTEGER },
                    difficulty: { type: Type.STRING, enum: ["쉬움", "보통", "도전"] },
                    actionStep: { type: Type.STRING },
                  },
                  required: ["title", "category", "expectedMonthlySaving", "difficulty", "actionStep"],
                },
              },
              immediateActions: {
                type: Type.ARRAY,
                description: "이번 주 당장 실행할 3가지 짧은 체크리스트 액션",
                items: { type: Type.STRING },
              },
            },
            required: [
              "headlineSummary",
              "spendingPersona",
              "monthlySaveableAmount",
              "saveableBasis",
              "habitAnalysis",
              "overspendingAreas",
              "savingStrategies",
              "immediateActions",
            ],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawText);

      res.json({
        analyzedAt: new Date().toISOString(),
        stats: {
          totalSpent: stats.totalSpent,
          monthlyBudget: stats.monthlyBudget,
          transactionCount: stats.transactionCount,
        },
        analysis: parsed,
      });
    } catch (err) {
      const { status, message } = extractErrorMessage(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/parse-expenses", async (req: Request, res: Response) => {
    try {
      const { rawText, defaultDate } = req.body as { rawText?: string; defaultDate?: string };
      if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
        res.status(400).json({ error: "변환할 지출 메모를 입력해 주세요." });
        return;
      }

      const ai = getAiClient();
      const fallbackDate = defaultDate || new Date().toISOString().slice(0, 10);

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `다음 자유 형식의 지출 메모에서 날짜, 항목명, 금액(KRW 정수), 카테고리를 추출해 주세요.
기본 날짜(날짜가 명시되지 않은 경우): ${fallbackDate}
사용 가능한 카테고리 목록(반드시 이 중 하나 선택):
["식비", "배달·외식", "카페·간식", "쇼핑·의류", "교통·차량", "구독·통신", "문화·여가", "생활·마트", "건강·의료", "기타"]

입력 텍스트:
${rawText.slice(0, 3000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD 형식 날짜" },
                title: { type: Type.STRING, description: "지출 내역 또는 상호명" },
                amount: { type: Type.INTEGER, description: "원 단위 정수 금액" },
                category: {
                  type: Type.STRING,
                  enum: [
                    "식비",
                    "배달·외식",
                    "카페·간식",
                    "쇼핑·의류",
                    "교통·차량",
                    "구독·통신",
                    "문화·여가",
                    "생활·마트",
                    "건강·의료",
                    "기타",
                  ],
                },
                memo: { type: Type.STRING, description: "부가 메모 (없으면 빈 문자열)" },
              },
              required: ["date", "title", "amount", "category"],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "[]").trim());
      res.json({ items: parsed });
    } catch (err) {
      const { status, message } = extractErrorMessage(err);
      res.status(status).json({ error: message });
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
