import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [row] = await db
    .insert(leads)
    .values({
      title: body.title,
      status: body.status ?? "new",
      source: body.source || null,
      value: body.value ? parseInt(body.value) : 0,
      notes: body.notes || null,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
