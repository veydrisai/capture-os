import { requireUser } from "@/app/sessions.server";
import PlaybookClient from "@/app/(dashboard)/playbook/PlaybookClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  return {};
}

export default function PlaybookPage() {
  return <PlaybookClient />;
}
