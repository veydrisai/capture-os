import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
    })
    .where(eq(leads.id, id))
    .returning();

  revalidateTag("leads");
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(leads).where(eq(leads.id, id));
  revalidateTag("leads");
  return NextResponse.json({ ok: true });
}
