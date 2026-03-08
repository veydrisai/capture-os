import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";
import { requireUser } from "@/app/sessions.server";
import SettingsClient from "@/app/(dashboard)/settings/SettingsClient";

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);
  const [ws] = await db.select().from(workspaceSettings).limit(1);
  return {
    user,
    workspaceSettings: ws ? {
      makeWebhookUrl: ws.makeWebhookUrl ?? "",
      n8nWebhookUrl: ws.n8nWebhookUrl ?? "",
      agreementTemplateUrl: ws.agreementTemplateUrl ?? "",
      intakeFormUrl: ws.intakeFormUrl ?? "",
      internalEmail: ws.internalEmail ?? "",
    } : { makeWebhookUrl: "", n8nWebhookUrl: "", agreementTemplateUrl: "", intakeFormUrl: "", internalEmail: "" },
  };
}

export default function SettingsPage({ loaderData }: { loaderData: any }) {
  return <SettingsClient user={loaderData.user} initialSettings={loaderData.workspaceSettings} />;
}
