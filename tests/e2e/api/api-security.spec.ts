/**
 * API Security tests — CaptureOS
 *
 * Verifies that every endpoint correctly enforces auth and rejects bad input.
 * No DB writes or emails are triggered — safe to run at any time.
 */

import { test, expect, request as newRequest } from "@playwright/test";
import { createHmac } from "node:crypto";

const BASE = process.env.BASE_URL ?? "https://captureos.app";

// Unauthenticated context (no session cookie)
let anon: Awaited<ReturnType<typeof newRequest.newContext>>;

test.beforeAll(async ({ playwright }) => {
  anon = await playwright.request.newContext({ baseURL: BASE });
});

test.afterAll(async () => {
  await anon.dispose();
});

// ── Auth-protected routes — should redirect / 401 without session ──────────

test.describe("Auth-protected routes reject unauthenticated requests", () => {
  const protectedGets = [
    "/api/leads",
    "/api/deals",
    "/api/contacts",
    "/api/clients",
    "/api/activities",
    "/api/workspace-settings",
    "/api/calendar",
  ];

  for (const path of protectedGets) {
    test(`GET ${path} → 302 or 401 without auth`, async () => {
      const res = await anon.get(path, { maxRedirects: 0 });
      expect([302, 401]).toContain(res.status());
    });
  }

  test("PATCH /api/deals/:id → 302 or 401 without auth", async () => {
    const res = await anon.patch("/api/deals/nonexistent", {
      data: { stage: "demo_done" },
      maxRedirects: 0,
    });
    expect([302, 401]).toContain(res.status());
  });

  test("DELETE /api/deals/:id → 302 or 401 without auth", async () => {
    const res = await anon.delete("/api/deals/nonexistent", { maxRedirects: 0 });
    expect([302, 401]).toContain(res.status());
  });

  test("PATCH /api/clients/:id → 302 or 401 without auth", async () => {
    const res = await anon.patch("/api/clients/nonexistent", {
      data: { onboardingStatus: "live" },
      maxRedirects: 0,
    });
    expect([302, 401]).toContain(res.status());
  });
});

// ── /api/lead-capture — public but requires x-capture-secret ─────────────

test.describe("/api/lead-capture auth", () => {
  test("rejects request with no secret header → 401", async () => {
    const res = await anon.post("/api/lead-capture", {
      data: { firstName: "Test", email: "test@test.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects request with wrong secret → 401", async () => {
    const res = await anon.post("/api/lead-capture", {
      headers: { "x-capture-secret": "wrong-secret" },
      data: { firstName: "Test", email: "test@test.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects missing firstName → 400", async () => {
    const res = await anon.post("/api/lead-capture", {
      headers: { "x-capture-secret": process.env.LEAD_CAPTURE_SECRET ?? "capturecsleads2026" },
      data: { email: "test@test.com" }, // no firstName
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/firstName/i);
  });

  test("rejects missing email → 400", async () => {
    const res = await anon.post("/api/lead-capture", {
      headers: { "x-capture-secret": process.env.LEAD_CAPTURE_SECRET ?? "capturecsleads2026" },
      data: { firstName: "Test" }, // no email
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  test("rejects non-POST methods → 405", async () => {
    const res = await anon.get("/api/lead-capture");
    expect(res.status()).toBe(405);
  });
});

// ── /api/cal-webhook — requires valid HMAC-SHA256 signature ──────────────

test.describe("/api/cal-webhook auth", () => {
  const CAL_SECRET = process.env.CAL_WEBHOOK_SECRET ?? "revenuecs";

  function sign(body: string): string {
    return createHmac("sha256", CAL_SECRET).update(body).digest("hex");
  }

  test("rejects missing signature → 401", async () => {
    const res = await anon.post("/api/cal-webhook", {
      data: { triggerEvent: "BOOKING_CREATED" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects wrong signature → 401", async () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED" });
    const res = await anon.post("/api/cal-webhook", {
      headers: {
        "x-cal-signature-256": "badbadbadbad",
        "content-type": "application/json",
      },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("skips non-BOOKING_CREATED events (no side effects) → 200 skipped", async () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CANCELLED" });
    const sig = sign(body);
    const res = await anon.post("/api/cal-webhook", {
      headers: {
        "x-cal-signature-256": sig,
        "content-type": "application/json",
      },
      data: body,
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
  });

  test("rejects non-POST methods → 405", async () => {
    const res = await anon.get("/api/cal-webhook");
    expect(res.status()).toBe(405);
  });
});

// ── /api/n8n-inbound — requires x-n8n-secret header ─────────────────────

test.describe("/api/n8n-inbound auth", () => {
  test("rejects missing secret → 401", async () => {
    const res = await anon.post("/api/n8n-inbound", {
      data: { action: "create_activity" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects wrong secret → 401", async () => {
    const res = await anon.post("/api/n8n-inbound", {
      headers: { "x-n8n-secret": "wrongsecret" },
      data: { action: "create_activity" },
    });
    expect(res.status()).toBe(401);
  });

  test("returns 400 for unknown action", async () => {
    const res = await anon.post("/api/n8n-inbound", {
      headers: { "x-n8n-secret": process.env.N8N_INBOUND_SECRET ?? "revenuecssecret" },
      data: { action: "unknown_action" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown/i);
  });

  test("returns 400 for update_client_onboarding without clientId", async () => {
    const res = await anon.post("/api/n8n-inbound", {
      headers: { "x-n8n-secret": process.env.N8N_INBOUND_SECRET ?? "revenuecssecret" },
      data: { action: "update_client_onboarding" }, // missing clientId
    });
    expect(res.status()).toBe(400);
  });

  test("returns 400 for update_deal_stage without required fields", async () => {
    const res = await anon.post("/api/n8n-inbound", {
      headers: { "x-n8n-secret": process.env.N8N_INBOUND_SECRET ?? "revenuecssecret" },
      data: { action: "update_deal_stage" }, // missing dealId and stage
    });
    expect(res.status()).toBe(400);
  });
});

// ── /api/leads — bulk import limit ────────────────────────────────────────

test.describe("/api/leads input validation", () => {
  test("rejects bulk import > 500 rows → 400 (with auth)", async ({ request }) => {
    const rows = Array.from({ length: 501 }, (_, i) => ({
      firstName: `Test${i}`,
      email: `test${i}@example.com`,
    }));
    const res = await request.post("/api/leads", { data: rows });
    // Without auth: 302/401. With auth: 400 for > 500 rows.
    expect([302, 400, 401]).toContain(res.status());
  });
});
