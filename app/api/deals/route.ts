import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(deals).orderBy(desc(deals.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [row] = await db
    .insert(deals)
    .values({
      title: body.title,
      stage: body.stage ?? "prospecting",
      value: body.value ? parseInt(body.value) : 0,
      probability: body.probability ? parseInt(body.probability) : 0,
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
      notes: body.notes || null,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
