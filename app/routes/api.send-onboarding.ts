import { db } from "@/lib/db";
import { workspaceSettings, clients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function action({ request }: { request: Request }) {
  await requireUser(request);
  const body = await request.json();
  const { clientEmail, clientName, clientId } = body;

  if (!clientEmail) {
    return Response.json({ error: "clientEmail is required" }, { status: 400 });
  }

  // Get workspace settings for webhook URL and intake form URL
  const [settings] = await db.select().from(workspaceSettings).limit(1);
  if (!settings?.makeWebhookUrl) {
    return Response.json({ error: "Make webhook URL not configured. Add it in Settings." }, { status: 400 });
  }

  const payload = {
    clientEmail,
    clientName,
    intakeFormUrl: settings.intakeFormUrl ?? "",
  };

  const webhookRes = await fetch(settings.makeWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!webhookRes.ok) {
    return Response.json({ error: "Webhook failed: " + webhookRes.statusText }, { status: 502 });
  }

  // Mark intake form sent on the client record
  if (clientId) {
    await db.update(clients).set({ intakeFormSent: true, updatedAt: new Date() }).where(eq(clients.id, clientId));
  }

  return Response.json({ ok: true });
}
