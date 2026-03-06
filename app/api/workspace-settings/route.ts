import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db.select().from(workspaceSettings).limit(1);
  return NextResponse.json(row ?? {});
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [existing] = await db.select().from(workspaceSettings).limit(1);

  if (existing) {
    const [row] = await db.update(workspaceSettings).set({
      makeWebhookUrl: body.makeWebhookUrl || null,
      agreementTemplateUrl: body.agreementTemplateUrl || null,
      intakeFormUrl: body.intakeFormUrl || null,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    }).returning();
    return NextResponse.json(row);
  } else {
    const [row] = await db.insert(workspaceSettings).values({
      makeWebhookUrl: body.makeWebhookUrl || null,
      agreementTemplateUrl: body.agreementTemplateUrl || null,
      intakeFormUrl: body.intakeFormUrl || null,
      updatedBy: session.user.id,
    }).returning();
    return NextResponse.json(row);
  }
}
