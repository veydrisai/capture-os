import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit).offset(offset);
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [row] = await db.insert(leads).values({
    firstName: body.firstName,
    lastName: body.lastName || "",
    email: body.email || null,
    phone: body.phone || null,
    company: body.company || null,
    status: body.status ?? "new",
    source: body.source || null,
    industry: body.industry || null,
    estimatedValue: body.estimatedValue ? parseInt(body.estimatedValue) : 0,
    systemInterest: body.systemInterest || null,
    notes: body.notes || null,
    createdBy: session.user.id,
    assignedTo: session.user.id,
  }).returning();

  revalidateTag("leads");
  return NextResponse.json(row, { status: 201 });
}
