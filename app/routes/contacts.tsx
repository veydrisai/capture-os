import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import ContactsClient from "@/app/(dashboard)/contacts/ContactsClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const data = await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(500);
  return Response.json(
    { contacts: data },
    { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } },
  );
}

export default function ContactsPage({ loaderData }: { loaderData: any }) {
  return <ContactsClient initialContacts={loaderData.contacts} />;
}
