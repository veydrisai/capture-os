import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return Response.json(rows);
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();
  const [row] = await db.insert(contacts).values({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email || null,
    phone: body.phone || null,
    title: body.title || null,
    company: body.company || null,
    type: body.type ?? "lead",
    createdBy: user.id,
  }).returning();
  return Response.json(row, { status: 201 });
}
