import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { contacts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import ContactsClient from "./ContactsClient";

const getContacts = unstable_cache(
  () => db.select().from(contacts).orderBy(desc(contacts.createdAt)),
  ["contacts"],
  { revalidate: 30, tags: ["contacts"] }
);

export default async function ContactsPage() {
  const data = await getContacts();
  return <ContactsClient initialContacts={data as Parameters<typeof ContactsClient>[0]["initialContacts"]} />;
}
