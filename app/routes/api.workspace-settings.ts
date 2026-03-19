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

function sanitizeUrl(val: unknown): string | null {
  if (!val || typeof val !== "string") return null;
  try {
    const u = new URL(val);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();
  const [existing] = await db.select().from(workspaceSettings).limit(1);

  const values = {
    makeWebhookUrl: sanitizeUrl(body.makeWebhookUrl),
    n8nWebhookUrl: sanitizeUrl(body.n8nWebhookUrl),
    agreementTemplateUrl: sanitizeUrl(body.agreementTemplateUrl),
    intakeFormUrl: sanitizeUrl(body.intakeFormUrl),
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
