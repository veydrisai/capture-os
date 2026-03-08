import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import ContactsClient from "@/app/(dashboard)/contacts/ContactsClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const data = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return { contacts: data };
}

export default function ContactsPage({ loaderData }: { loaderData: any }) {
  return <ContactsClient initialContacts={loaderData.contacts} />;
}
