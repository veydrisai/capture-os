import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const rows = await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(limit).offset(offset);
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
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
    createdBy: session.user.id,
    assignedTo: session.user.id,
  }).returning();

  revalidateTag("deals"); revalidateTag("dashboard");
  return NextResponse.json(row, { status: 201 });
}
