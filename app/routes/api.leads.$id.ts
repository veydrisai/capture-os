import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  await requireUser(request);
  const { id } = params;
  const [row] = await db.select().from(leads).where(eq(leads.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  await requireUser(request);
  const { id } = params;

  if (request.method === "DELETE") {
    await db.delete(leads).where(eq(leads.id, id));
    return Response.json({ ok: true });
  }

  const body = await request.json();
  const [row] = await db.update(leads).set({
    firstName: body.firstName,
    lastName: body.lastName || "",
    email: body.email || null,
    phone: body.phone || null,
    company: body.company || null,
    status: body.status,
    source: body.source || null,
    industry: body.industry || null,
    estimatedValue: body.estimatedValue ? parseInt(body.estimatedValue) : 0,
    systemInterest: body.systemInterest || null,
    notes: body.notes || null,
    updatedAt: new Date(),
  }).where(eq(leads.id, id)).returning();
  return Response.json(row);
}
