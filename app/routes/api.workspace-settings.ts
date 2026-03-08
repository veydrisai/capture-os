import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const [ws] = await db.select().from(workspaceSettings).limit(1);
  return Response.json(ws ?? {
    makeWebhookUrl: null,
    n8nWebhookUrl: null,
    agreementTemplateUrl: null,
    intakeFormUrl: null,
    internalEmail: null,
  });
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();
  const [existing] = await db.select().from(workspaceSettings).limit(1);

  const values = {
    makeWebhookUrl: body.makeWebhookUrl || null,
    n8nWebhookUrl: body.n8nWebhookUrl || null,
    agreementTemplateUrl: body.agreementTemplateUrl || null,
    intakeFormUrl: body.intakeFormUrl || null,
    internalEmail: body.internalEmail || null,
    updatedBy: user.id,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(workspaceSettings).set(values);
  } else {
    await db.insert(workspaceSettings).values(values);
  }
  return Response.json({ ok: true });
}
