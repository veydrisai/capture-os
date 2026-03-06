import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [row] = await db
    .update(contacts)
    .set({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      title: body.title || null,
      company: body.company || null,
      type: body.type,
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, id))
    .returning();

  revalidateTag("contacts");
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidateTag("contacts");
  return NextResponse.json({ ok: true });
}
