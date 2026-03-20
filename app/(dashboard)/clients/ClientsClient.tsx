
import { useState } from "react";
import { Plus, Search, Check, Circle } from "lucide-react";
import ClientModal from "@/components/crm/ClientModal";

interface Client {
  id: string;
  businessName: string;
  email: string | null;
  contactId: string | null;
  dealId: string | null;
  systemType: string | null;
  onboardingStatus: string;
  intakeFormSent: boolean;
  intakeFormComplete: boolean;
  complianceReviewed: boolean;
  complianceApproved: boolean;
  accountsChecklist: boolean;
  kickoffScheduled: boolean;
  kickoffDone: boolean;
  buildComplete: boolean;
  testingComplete: boolean;
  softLaunchDone: boolean;
  goLiveDate: string | Date | null;
  twilioAccountSid: string | null;
  vapiAssistantId: string | null;
  makeWebhookUrl: string | null;
  roiDashboardUrl: string | null;
  monthlyRetainer: number;
  nextBillingDate: string | Date | null;
  complianceNotes: string | null;
  notes: string | null;
}

const CHECKLIST_KEYS = [
  "intakeFormSent", "intakeFormComplete", "complianceReviewed", "complianceApproved",
  "accountsChecklist", "kickoffScheduled", "kickoffDone", "buildComplete", "testingComplete", "softLaunchDone",
];

const statusColor: Record<string, { color: string; bg: string; border: string }> = {
  pending:             { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)" },
  intake_sent:         { color: "#c7d2fe", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.25)" },
  intake_complete:     { color: "#a5f3fc", bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.25)" },
  compliance_review:   { color: "#fde68a", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  compliance_approved: { color: "#fed7aa", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)" },
  building:            { color: "#ddd6fe", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)" },
  testing:             { color: "#fda4af", bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.25)" },
  soft_launch:         { color: "#bbf7d0", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.25)" },
  live:                { color: "#4ade80", bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.35)" },
};

const systemLabel: Record<string, string> = {
  reactivation: "Reactivation", hot_lead: "Hot Lead", backend: "Backend", combo: "Combo",
};

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      setClients(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }

  const filtered = clients.filter((c) => c.businessName.toLowerCase().includes(search.toLowerCase()));
  const liveClients = clients.filter((c) => c.onboardingStatus === "live");
  const mrr = liveClients.reduce((s, c) => s + (c.monthlyRetainer ?? 0), 0);

  return (
    <div className="animate-fade-up">
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Clients</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>
            {clients.length} total · {liveClients.length} live · ${mrr.toLocaleString()}/mo MRR
          </p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #A855F7)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 24, marginTop: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." style={{ width: "100%", maxWidth: 360, padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }} />
      </div>

      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: "60px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>No clients yet</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>Add your first client to start tracking onboarding.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((client) => {
            const done = CHECKLIST_KEYS.filter((k) => client[k as keyof Client]).length;
            const pct = Math.round((done / CHECKLIST_KEYS.length) * 100);
            const st = statusColor[client.onboardingStatus] ?? statusColor.pending;
            return (
              <div key={client.id} className="glass card-hover" onClick={() => { setEditing(client); setModalOpen(true); }} style={{ padding: "18px 22px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>{client.businessName}</h3>
                      {client.systemType && <span style={{ fontSize: 10.5, color: "rgba(167,139,250,0.85)", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 6, padding: "1px 7px", fontWeight: 500 }}>{systemLabel[client.systemType]}</span>}
                      <span style={{ fontSize: 10.5, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 6, padding: "1px 7px", fontWeight: 500 }}>{client.onboardingStatus.replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#4ade80" : "linear-gradient(90deg,#7C3AED,#A855F7)", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{done}/{CHECKLIST_KEYS.length} steps</span>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {[
                        { key: "intakeFormSent", short: "Intake" }, { key: "complianceApproved", short: "Compliance" },
                        { key: "accountsChecklist", short: "Accounts" }, { key: "kickoffDone", short: "Kickoff" },
                        { key: "buildComplete", short: "Build" }, { key: "testingComplete", short: "Testing" },
                        { key: "softLaunchDone", short: "Soft Launch" },
                      ].map(({ key, short }) => {
                        const checked = Boolean(client[key as keyof Client]);
                        return (
                          <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 6, fontSize: 10.5, background: checked ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${checked ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.07)"}`, color: checked ? "#86efac" : "rgba(255,255,255,0.3)" }}>
                            {checked ? <Check size={9} strokeWidth={2.5} /> : <Circle size={9} strokeWidth={1.5} />}
                            {short}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {client.monthlyRetainer > 0 && (
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", letterSpacing: "-0.03em" }}>${client.monthlyRetainer.toLocaleString()}</p>
                        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>/month</p>
                      </div>
                    )}
                    {client.goLiveDate && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>Live: {new Date(client.goLiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
                    {client.nextBillingDate && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>Billed: {new Date(client.nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && <ClientModal client={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
