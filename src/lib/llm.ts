// Провайдер-агностичный слой LLM для генерации JSON.
//
// Зачем: чтобы смена модели/тарифа/провайдера была одной env-переменной,
// а не правкой кода по всему проекту (нужно для гибкости и второго проекта).
//
// ENV:
//   LLM_PROVIDER  — "gemini" (по умолчанию). Место для "openai" / "anthropic" и т.п.
//   GEMINI_API_KEY, GEMINI_MODEL (по умолчанию gemini-2.5-flash)
//
// Отличает временные сбои (обрезанный JSON, 5xx) — их ретраит,
// от исчерпания квоты (429/дневной лимит) — кидает QuotaError, чтобы
// вызывающий мог корректно остановить батч, а не жечь заведомо провальные запросы.

import { GoogleGenerativeAI } from "@google/generative-ai";

/** Исчерпана квота/лимит — продолжать батч бессмысленно. */
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export interface LlmClient {
  /** Отдаёт распарсенный JSON. Ретраит транзиентное, кидает QuotaError на лимите. */
  generateJSON<T = unknown>(prompt: string): Promise<T>;
}

const RETRIES = 3;

function isQuotaError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e?.status === 429 || /\b429\b|quota|rate limit|too many requests/i.test(e?.message ?? "");
}

class GeminiClient implements LlmClient {
  private model;
  constructor(apiKey: string, modelName: string) {
    this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });
  }

  async generateJSON<T = unknown>(prompt: string): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const res = await this.model.generateContent(prompt);
        return JSON.parse(res.response.text()) as T;
      } catch (err) {
        if (isQuotaError(err)) {
          // дневной лимит/rate limit — не ретраим внутри, отдаём наверх
          throw new QuotaError(String((err as Error)?.message ?? err));
        }
        lastErr = err; // транзиент (обрезанный JSON и т.п.) — пауза и повтор
        if (attempt < RETRIES) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    throw lastErr;
  }
}

let cached: LlmClient | null = null;

export function getLlm(): LlmClient {
  if (cached) return cached;
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY не задан");
    cached = new GeminiClient(key, process.env.GEMINI_MODEL ?? "gemini-2.5-flash");
    return cached;
  }

  // сюда позже: OpenAIClient / AnthropicClient — реализуют тот же LlmClient
  throw new Error(`Неизвестный LLM_PROVIDER: ${provider}`);
}
