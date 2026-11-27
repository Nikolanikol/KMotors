import { spawn } from "node:child_process";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// Раннер крона — настоящий процесс `node scripts/cron/run.mjs <задание>` против заглушки
// вместо приложения. Проверяем КОД ВОЗВРАТА и лог: именно по ним Coolify красит задачу.

const RUNNER = path.resolve(__dirname, "../../scripts/cron/run.mjs");
let server: http.Server | null = null;

afterEach(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  server = null;
});

async function runJob(job: string, status: number, body: unknown) {
  server = http.createServer((_req, res) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  });
  await new Promise<void>((r) => server!.listen(0, "127.0.0.1", r));
  const port = (server!.address() as AddressInfo).port;
  return await new Promise<{ code: number | null; out: string; err: string }>((resolve) => {
    const child = spawn(process.execPath, [RUNNER, job], {
      env: { ...process.env, PORT: String(port), POSTER_CRON_SECRET: "test-secret" } as NodeJS.ProcessEnv,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

const LIVENESS_ABORTED = {
  ok: false,
  aborted: "rate_limited",
  mode: "proxy",
  probed: 2,
  alive: 0,
  sold: 0,
};

describe("раннер крона: задание cars", () => {
  it("листинг ок, проверка живости честно прервалась — код 0 и NOTICE (не красим запуск)", async () => {
    const r = await runJob("cars", 200, { ok: true, pages: 33, written: 355, liveness: LIVENESS_ABORTED });
    expect(r.code).toBe(0);
    expect(r.err).toContain("NOTICE");
    expect(r.err).toContain("rate_limited");
    expect(r.err).not.toContain("WARNING");
  });

  it("листинг не отдал ничего (ok верхнего уровня false) — код 2: это настоящий провал", async () => {
    const r = await runJob("cars", 200, { ok: false, pages: 5, written: 0, liveness: { ok: true } });
    expect(r.code).toBe(2);
    expect(r.err).toContain("ok:false");
  });

  it("всё хорошо — код 0 без NOTICE", async () => {
    const r = await runJob("cars", 200, { ok: true, written: 3000, liveness: { ok: true, probed: 1000 } });
    expect(r.code).toBe(0);
    expect(r.err).not.toContain("NOTICE");
  });

  it("не-2xx — код 1", async () => {
    const r = await runJob("cars", 500, { ok: false, error: "x" });
    expect(r.code).toBe(1);
  });

  it("обрезанное/не-JSON тело: действует прежняя регулярка по всему телу (код 2 при ok:false)", async () => {
    const r = await runJob("cars", 200, '{"ok":false,"liveness":{"ok":fal');
    expect(r.code).toBe(2);
  });

  it("другие задания не затронуты: у них любое вложенное ok:false по-прежнему красит запуск", async () => {
    const r = await runJob("rss", 200, { ok: true, nested: { ok: false } });
    expect(r.code).toBe(2);
  });
});
