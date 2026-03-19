import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return Response.json(rows);
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();

  // Bulk import — body is an array
  if (Array.isArray(body)) {
    if (body.length > 500) {
      return Response.json({ error: "Bulk import limited to 500 rows per request" }, { status: 400 });
    }
    const values = body
      .filter((r: Record<string, unknown>) => r.firstName || r.email)
      .map((r: Record<string, unknown>) => ({
        firstName: String(r.firstName || ""),
        lastName: String(r.lastName || ""),
        email: r.email ? String(r.email) : null,
        phone: r.phone ? String(r.phone) : null,
        company: r.company ? String(r.company) : null,
        status: "new" as const,
        source: r.source ? String(r.source) : "import",
        industry: r.industry ? String(r.industry) : null,
        estimatedValue: r.estimatedValue ? Math.min(10_000_000, parseInt(String(r.estimatedValue), 10) || 0) : 0,
        systemInterest: r.systemInterest ? String(r.systemInterest) : null,
        notes: r.notes ? String(r.notes) : null,
        createdBy: user.id,
        assignedTo: user.id,
      }));
    if (!values.length) return Response.json({ error: "No valid rows" }, { status: 400 });
    const rows = await db.insert(leads).values(values).returning();
    return Response.json(rows, { status: 201 });
  }

  // Single insert
  const [row] = await db.insert(leads).values({
    firstName: body.firstName,
    lastName: body.lastName || "",
    email: body.email || null,
    phone: body.phone || null,
    company: body.company || null,
    status: body.status ?? "new",
    source: body.source || null,
    industry: body.industry || null,
    estimatedValue: body.estimatedValue ? parseInt(body.estimatedValue) : 0,
    systemInterest: body.systemInterest || null,
    notes: body.notes || null,
    createdBy: user.id,
    assignedTo: user.id,
  }).returning();
  return Response.json(row, { status: 201 });
}
