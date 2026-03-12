import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(limit).offset(offset);
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [row] = await db.insert(contacts).values({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email || null,
    phone: body.phone || null,
    title: body.title || null,
    company: body.company || null,
    type: body.type ?? "lead",
    createdBy: session.user.id,
  }).returning();

  revalidateTag("contacts");
  return NextResponse.json(row, { status: 201 });
}
