import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [row] = await db
    .update(leads)
    .set({
      title: body.title,
      status: body.status,
      source: body.source || null,
      value: body.value ? parseInt(body.value) : 0,
      notes: body.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(leads).where(eq(leads.id, id));
  return NextResponse.json({ ok: true });
}
