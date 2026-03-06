import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [row] = await db
    .update(deals)
    .set({
      title: body.title,
      stage: body.stage,
      value: body.value ? parseInt(body.value) : 0,
      probability: body.probability ? parseInt(body.probability) : 0,
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(deals).where(eq(deals.id, id));
  return NextResponse.json({ ok: true });
}
