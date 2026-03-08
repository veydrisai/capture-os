import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  await requireUser(request);
  const { id } = params;

  if (request.method === "DELETE") {
    await db.delete(contacts).where(eq(contacts.id, id));
    return Response.json({ ok: true });
  }

  const body = await request.json();
  const [row] = await db.update(contacts).set({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email || null,
    phone: body.phone || null,
    title: body.title || null,
    company: body.company || null,
    type: body.type,
    updatedAt: new Date(),
  }).where(eq(contacts.id, id)).returning();
  return Response.json(row);
}
