import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [row] = await db
    .insert(activities)
    .values({
      type: body.type ?? "note",
      title: body.title,
      body: body.body || null,
      contactId: body.contactId || null,
      leadId: body.leadId || null,
      dealId: body.dealId || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
