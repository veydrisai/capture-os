import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const rows = await db.select().from(deals).orderBy(desc(deals.createdAt));
  return Response.json(rows);
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();
  const [row] = await db.insert(deals).values({
    title: body.title,
    stage: body.stage ?? "cold_outreach",
    systemType: body.systemType || null,
    value: body.value ? parseInt(body.value) : 0,
    setupFee: body.setupFee ? parseInt(body.setupFee) : 0,
    monthlyRetainer: body.monthlyRetainer ? parseInt(body.monthlyRetainer) : 0,
    probability: body.probability ? parseInt(body.probability) : 0,
    closeDate: body.closeDate ? new Date(body.closeDate) : null,
    notes: body.notes || null,
    createdBy: user.id,
    assignedTo: user.id,
  }).returning();
  return Response.json(row, { status: 201 });
}
