import { requireUser } from "@/app/sessions.server";
import CalendarClient from "@/components/crm/CalendarClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  return {};
}

export default function CalendarPage() {
  return <CalendarClient />;
}
