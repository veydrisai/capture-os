import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const rows = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50);
  return Response.json(rows);
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();
  const [row] = await db.insert(activities).values({
    type: body.type ?? "note",
    title: body.title,
    body: body.body || null,
    contactId: body.contactId || null,
    leadId: body.leadId || null,
    dealId: body.dealId || null,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    createdBy: user.id,
  }).returning();
  return Response.json(row, { status: 201 });
}
