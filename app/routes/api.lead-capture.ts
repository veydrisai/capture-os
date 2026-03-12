import { db } from "@/lib/db";
import { leads, workspaceSettings } from "@/drizzle/schema";
import { triggerN8n } from "@/lib/n8n.server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

/**
 * Public lead capture endpoint — no auth required.
 * Used by the capturecs.com website contact/demo request form.
 * Auth: x-capture-secret header must match LEAD_CAPTURE_SECRET env var.
 */
export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const secret = request.headers.get("x-capture-secret");
  if (secret !== process.env.LEAD_CAPTURE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { firstName, lastName, email, phone, company, industry, systemInterest, notes } = body;

  if (!firstName || !email) {
    return Response.json({ error: "firstName and email are required" }, { status: 400 });
  }

  const [row] = await db.insert(leads).values({
    firstName,
    lastName: lastName || "",
    email,
    phone: phone || null,
    company: company || null,
    industry: industry || null,
    systemInterest: systemInterest || null,
    notes: notes || null,
    source: "website",
    status: "new",
  }).returning();

  // Fire n8n Play B — inbound lead automation
  const [ws] = await db.select().from(workspaceSettings).limit(1);
  await triggerN8n(ws?.n8nWebhookUrl, "lead.inbound", {
    leadId: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    company: row.company,
    systemInterest: row.systemInterest,
    source: "website",
    internalEmail: ws?.internalEmail,
  });

  return Response.json({ ok: true, leadId: row.id }, { status: 201 });
}
