import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating enums...");

  await sql`
    DO $$ BEGIN
      CREATE TYPE deal_stage AS ENUM ('cold_outreach','demo_booked','demo_done','proposal_sent','agreement_signed','onboarding','live','upsell','lost');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE lead_status AS ENUM ('new','contacted','interested','demo_scheduled','no_show','not_qualified','qualified','closed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE system_type AS ENUM ('reactivation','hot_lead','backend','combo');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE onboarding_status AS ENUM ('pending','intake_sent','intake_complete','compliance_review','compliance_approved','building','testing','soft_launch','live');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE activity_type AS ENUM ('note','call','email','meeting','task','demo','follow_up');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE contact_type AS ENUM ('lead','prospect','client','partner');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  console.log("Creating NextAuth tables...");
  await sql`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified TIMESTAMP,
    image TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT
  )`;

  await sql`CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
  )`;

  console.log("Creating contacts...");
  await sql`CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    company TEXT,
    type contact_type NOT NULL DEFAULT 'lead',
    linked_in TEXT,
    industry TEXT,
    estimated_leads_per_month INTEGER,
    current_crm TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("Creating deals...");
  await sql`CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    stage deal_stage NOT NULL DEFAULT 'cold_outreach',
    system_type system_type,
    value INTEGER DEFAULT 0,
    setup_fee INTEGER DEFAULT 0,
    monthly_retainer INTEGER DEFAULT 0,
    probability INTEGER DEFAULT 0,
    close_date TIMESTAMP,
    agreement_sent_at TIMESTAMP,
    agreement_signed_at TIMESTAMP,
    payment_received_at TIMESTAMP,
    demo_booked_at TIMESTAMP,
    demo_done_at TIMESTAMP,
    webhook_fired BOOLEAN DEFAULT FALSE,
    notes TEXT,
    lost_reason TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("Creating clients...");
  await sql`CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    system_type system_type,
    onboarding_status onboarding_status NOT NULL DEFAULT 'pending',
    intake_form_sent BOOLEAN DEFAULT FALSE,
    intake_form_complete BOOLEAN DEFAULT FALSE,
    compliance_reviewed BOOLEAN DEFAULT FALSE,
    compliance_approved BOOLEAN DEFAULT FALSE,
    accounts_checklist BOOLEAN DEFAULT FALSE,
    kickoff_scheduled BOOLEAN DEFAULT FALSE,
    kickoff_done BOOLEAN DEFAULT FALSE,
    build_complete BOOLEAN DEFAULT FALSE,
    testing_complete BOOLEAN DEFAULT FALSE,
    soft_launch_done BOOLEAN DEFAULT FALSE,
    go_live_date TIMESTAMP,
    twilio_account_sid TEXT,
    vapi_assistant_id TEXT,
    make_webhook_url TEXT,
    roi_dashboard_url TEXT,
    monthly_retainer INTEGER DEFAULT 0,
    next_billing_date TIMESTAMP,
    compliance_notes TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("Creating leads...");
  await sql`CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status lead_status NOT NULL DEFAULT 'new',
    source TEXT,
    industry TEXT,
    estimated_value INTEGER DEFAULT 0,
    system_interest system_type,
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    converted_to_contact_id UUID,
    converted_to_deal_id UUID,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("Creating activities...");
  await sql`CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type activity_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    google_event_id TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("Creating workspace_settings...");
  await sql`CREATE TABLE IF NOT EXISTS workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make_webhook_url TEXT,
    agreement_template_url TEXT,
    intake_form_url TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("All tables created successfully.");
}

main().catch(console.error);
