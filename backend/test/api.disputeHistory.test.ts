import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTRIBUTOR, validCreateBody } from "./fixtures";

let storeFile: string;

beforeEach(async () => {
  storeFile = path.join(os.tmpdir(), `bounty-api-dispute-history-${randomUUID()}.json`);
  fs.writeFileSync(storeFile, "[]", "utf8");
  process.env.BOUNTY_STORE_PATH = storeFile;
  process.env.NODE_ENV = "test";
  vi.resetModules();
});

afterEach(() => {
  delete process.env.BOUNTY_STORE_PATH;
  try {
    fs.unlinkSync(storeFile);
  } catch {
    /* best-effort */
  }
  try {
    const auditStorePath = storeFile.replace(/\.json$/i, ".audit.json");
    fs.unlinkSync(auditStorePath);
  } catch {
    /* best-effort */
  }
});

async function getApp() {
  const { app } = await import("../src/app");
  return app;
}

async function seedSubmittedBounty(app: Awaited<ReturnType<typeof getApp>>): Promise<string> {
  const createRes = await request(app).post("/api/bounties").send(validCreateBody).expect(201);
  const id = createRes.body.data.id as string;

  await request(app)
    .post(`/api/bounties/${id}/reserve`)
    .send({ contributor: CONTRIBUTOR })
    .expect(200);

  await request(app)
    .post(`/api/bounties/${id}/submit`)
    .send({
      contributor: CONTRIBUTOR,
      submissionUrl: "https://github.com/owner/repo/pull/1",
    })
    .expect(200);

  return id;
}

describe("GET /api/bounties/:id/dispute-history", () => {
  it("returns an empty list for a bounty that was never disputed", async () => {
    const app = await getApp();
    const createRes = await request(app).post("/api/bounties").send(validCreateBody).expect(201);
    const id = createRes.body.data.id as string;

    const res = await request(app).get(`/api/bounties/${id}/dispute-history`).expect(200);

    expect(res.body.data).toEqual([]);
  });

  it("returns chronological dispute events for a disputed bounty", async () => {
    const app = await getApp();
    const id = await seedSubmittedBounty(app);

    await request(app)
      .post(`/api/bounties/${id}/dispute`)
      .send({
        contributor: CONTRIBUTOR,
        reason: "Maintainer did not review within the agreed timeframe.",
      })
      .expect(200);

    const res = await request(app).get(`/api/bounties/${id}/dispute-history`).expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      type: "dispute-raised",
      actor: CONTRIBUTOR,
      description: "Maintainer did not review within the agreed timeframe.",
    });
    expect(res.body.data[0].timestamp).toBeGreaterThan(0);
  });

  it("returns 400 for an unknown bounty id", async () => {
    const app = await getApp();

    const res = await request(app).get("/api/bounties/BNT-9999/dispute-history").expect(400);

    expect(res.body.error).toMatch(/not found/i);
  });
});
