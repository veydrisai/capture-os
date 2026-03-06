import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const data = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return <ContactsClient initialContacts={data as Parameters<typeof ContactsClient>[0]["initialContacts"]} />;
}
