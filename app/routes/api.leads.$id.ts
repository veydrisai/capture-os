import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

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
