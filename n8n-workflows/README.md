# CaptureOS n8n Workflows

## Setup

### 1. n8n Variables (set in n8n UI → Settings → Variables)
| Variable | Value |
|---|---|
| `FROM_EMAIL` | Your sending email (e.g. team@youragency.com) |
| `CAPTURECOS_URL` | Your CaptureOS URL (e.g. https://your-crm.com) |
| `N8N_INBOUND_SECRET` | Match the `N8N_INBOUND_SECRET` env var in CaptureOS |
| `CAPTURECOS_SESSION` | Session cookie for CRM API auth (for read endpoints) |

### 2. SMTP Credential
In n8n → Credentials → New → SMTP, create a credential named **"SMTP"** with your email provider details.

### 3. CaptureOS Environment Variable
Add to `.env.local` in CaptureOS:
```
N8N_INBOUND_SECRET=your-shared-secret-here
```

### 4. Import Workflows
In n8n → Workflows → Import from File → select each `.json` file.

### 5. Configure CaptureOS Settings
In CaptureOS → Settings:
- **n8n Webhook URL**: Your n8n webhook base URL (e.g. `http://your-vps:5678/webhook`)
- **Internal Notification Email**: Your team email
- **Agreement Template URL**: Your DocuSign/PandaDoc link
- **Intake Form URL**: Your Google Form/Typeform link

---

## Workflows

### 01 — Demo Done → Agreement Sender
**Trigger:** Deal moved to `demo_done` stage
- Emails agreement link to prospect
- Alerts internal team
- Logs activity in CRM

### 02 — Agreement Signed → Onboarding Kickoff
**Trigger:** Deal moved to `agreement_signed` stage
- Fetches client record from CRM
- Emails intake form to new client
- Marks `intakeFormSent = true` + `onboardingStatus = intake_sent` in CRM
- Alerts internal team
- Logs activity in CRM

### 03 — Client Live + Weekly ROI Reports
**Trigger A:** Client onboarding status → `live`
- Emails go-live celebration to client with ROI dashboard link
- Alerts internal team
- Logs activity in CRM

**Trigger B:** Every Monday 9 AM (cron)
- Fetches all live clients from CRM
- Emails each client their ROI dashboard link
- Logs activity per client in CRM

---

## Data Flow

```
CaptureOS (stage change)
    ↓ POST to n8n webhook
n8n workflow runs
    ↓ sends emails via SMTP
    ↓ POST to /api/n8n-inbound (write back to CRM)
CaptureOS updated (activities logged, onboarding fields marked)
```
