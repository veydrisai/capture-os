import {
  pgTable, text, timestamp, uuid, integer,
  boolean, pgEnum, primaryKey, index,
} from "drizzle-orm/pg-core";

// ─── NextAuth Tables ──────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => [
  index("idx_accounts_user_id").on(t.userId),
  index("idx_accounts_provider").on(t.provider, t.providerAccountId),
]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (t) => [
  index("idx_sessions_user_id").on(t.userId),
  index("idx_sessions_expires").on(t.expires),
]);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Enums ────────────────────────────────────────────────────────────────────

export const dealStageEnum = pgEnum("deal_stage", [
  "cold_outreach",
  "demo_booked",
  "demo_done",
  "proposal_sent",
  "agreement_signed",
  "onboarding",
  "live",
  "upsell",
  "lost",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "interested",
  "demo_scheduled",
  "no_show",
  "not_qualified",
  "qualified",
  "closed",
]);

export const systemTypeEnum = pgEnum("system_type", [
  "reactivation",
  "hot_lead",
  "backend",
  "combo",
]);

export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "pending",
  "intake_sent",
  "intake_complete",
  "compliance_review",
  "compliance_approved",
  "building",
  "testing",
  "soft_launch",
  "live",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "note", "call", "email", "meeting", "task", "demo", "follow_up",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "lead", "prospect", "client", "partner",
]);

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  title: text("title"),
  company: text("company"),
  type: contactTypeEnum("type").default("lead").notNull(),
  linkedIn: text("linked_in"),
  industry: text("industry"),
  estimatedLeadsPerMonth: integer("estimated_leads_per_month"),
  currentCrm: text("current_crm"),
  notes: text("notes"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_contacts_email").on(t.email),
  index("idx_contacts_type").on(t.type),
  index("idx_contacts_company").on(t.company),
  index("idx_contacts_assigned_to").on(t.assignedTo),
  index("idx_contacts_created_at").on(t.createdAt),
]);

// ─── Deals (Sales Pipeline) ───────────────────────────────────────────────────

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  stage: dealStageEnum("stage").default("cold_outreach").notNull(),
  systemType: systemTypeEnum("system_type"),
  value: integer("value").default(0),
  setupFee: integer("setup_fee").default(0),
  monthlyRetainer: integer("monthly_retainer").default(0),
  probability: integer("probability").default(0),
  closeDate: timestamp("close_date"),
  agreementSentAt: timestamp("agreement_sent_at"),
  agreementSignedAt: timestamp("agreement_signed_at"),
  paymentReceivedAt: timestamp("payment_received_at"),
  demoBookedAt: timestamp("demo_booked_at"),
  demoDoneAt: timestamp("demo_done_at"),
  webhookFired: boolean("webhook_fired").default(false),
  notes: text("notes"),
  lostReason: text("lost_reason"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_deals_stage").on(t.stage),
  index("idx_deals_contact_id").on(t.contactId),
  index("idx_deals_assigned_to").on(t.assignedTo),
  index("idx_deals_updated_at").on(t.updatedAt),
  index("idx_deals_created_at").on(t.createdAt),
  index("idx_deals_demo_booked_at").on(t.demoBookedAt),
  index("idx_deals_agreement_at").on(t.agreementSignedAt),
]);

// ─── Clients (Post-Close Onboarding) ─────────────────────────────────────────

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  businessName: text("business_name").notNull(),
  systemType: systemTypeEnum("system_type"),
  onboardingStatus: onboardingStatusEnum("onboarding_status").default("pending").notNull(),
  intakeFormSent: boolean("intake_form_sent").default(false),
  intakeFormComplete: boolean("intake_form_complete").default(false),
  complianceReviewed: boolean("compliance_reviewed").default(false),
  complianceApproved: boolean("compliance_approved").default(false),
  accountsChecklist: boolean("accounts_checklist").default(false),
  kickoffScheduled: boolean("kickoff_scheduled").default(false),
  kickoffDone: boolean("kickoff_done").default(false),
  buildComplete: boolean("build_complete").default(false),
  testingComplete: boolean("testing_complete").default(false),
  softLaunchDone: boolean("soft_launch_done").default(false),
  goLiveDate: timestamp("go_live_date"),
  twilioAccountSid: text("twilio_account_sid"),
  vapiAssistantId: text("vapi_assistant_id"),
  makeWebhookUrl: text("make_webhook_url"),
  roiDashboardUrl: text("roi_dashboard_url"),
  monthlyRetainer: integer("monthly_retainer").default(0),
  nextBillingDate: timestamp("next_billing_date"),
  complianceNotes: text("compliance_notes"),
  notes: text("notes"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_clients_status").on(t.onboardingStatus),
  index("idx_clients_contact_id").on(t.contactId),
  index("idx_clients_deal_id").on(t.dealId),
  index("idx_clients_assigned_to").on(t.assignedTo),
  index("idx_clients_created_at").on(t.createdAt),
]);

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  status: leadStatusEnum("status").default("new").notNull(),
  source: text("source"),
  industry: text("industry"),
  estimatedValue: integer("estimated_value").default(0),
  systemInterest: systemTypeEnum("system_interest"),
  notes: text("notes"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  convertedToContactId: uuid("converted_to_contact_id"),
  convertedToDealId: uuid("converted_to_deal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_leads_status").on(t.status),
  index("idx_leads_email").on(t.email),
  index("idx_leads_system_interest").on(t.systemInterest),
  index("idx_leads_assigned_to").on(t.assignedTo),
  index("idx_leads_created_at").on(t.createdAt),
]);

// ─── Activities ───────────────────────────────────────────────────────────────

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: activityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  completed: boolean("completed").default(false),
  googleEventId: text("google_event_id"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_activities_contact_id").on(t.contactId),
  index("idx_activities_deal_id").on(t.dealId),
  index("idx_activities_lead_id").on(t.leadId),
  index("idx_activities_client_id").on(t.clientId),
  index("idx_activities_type").on(t.type),
  index("idx_activities_completed").on(t.completed),
  index("idx_activities_created_at").on(t.createdAt),
]);

// ─── Workspace Settings ───────────────────────────────────────────────────────

export const workspaceSettings = pgTable("workspace_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  makeWebhookUrl: text("make_webhook_url"),
  agreementTemplateUrl: text("agreement_template_url"),
  intakeFormUrl: text("intake_form_url"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
