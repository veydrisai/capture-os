"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface ParsedLead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  source: string;
  systemInterest: string;
  estimatedValue: string;
  notes: string;
}

interface Props {
  onClose: () => void;
  onImported: () => void;
}

// Maps any common header variant → our field name
const HEADER_MAP: Record<string, keyof ParsedLead> = {
  // firstName
  firstname: "firstName", first_name: "firstName", "first name": "firstName", first: "firstName",
  // lastName
  lastname: "lastName", last_name: "lastName", "last name": "lastName", last: "lastName",
  surname: "lastName",
  // email
  email: "email", "e-mail": "email", "email address": "email",
  // phone
  phone: "phone", "phone number": "phone", mobile: "phone", "mobile number": "phone", cell: "phone",
  // company
  company: "company", business: "company", "company name": "company", "business name": "company",
  organization: "company", organisation: "company",
  // industry
  industry: "industry", sector: "industry",
  // source
  source: "source", "lead source": "source", "how did you hear": "source",
  // systemInterest
  systeminterest: "systemInterest", system_interest: "systemInterest", "system interest": "systemInterest",
  "interested in": "systemInterest", interest: "systemInterest",
  // estimatedValue
  estimatedvalue: "estimatedValue", estimated_value: "estimatedValue", value: "estimatedValue",
  "estimated value": "estimatedValue", "deal value": "estimatedValue", revenue: "estimatedValue",
  // notes
  notes: "notes", note: "notes", comments: "notes", comment: "notes", description: "notes",
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(splitLine);
  return { headers, rows };
}

function mapHeaders(headers: string[]): (keyof ParsedLead | null)[] {
  return headers.map((h) => HEADER_MAP[h.toLowerCase().trim()] ?? null);
}

function rowToLead(row: string[], mapping: (keyof ParsedLead | null)[]): ParsedLead {
  const lead: ParsedLead = {
    firstName: "", lastName: "", email: "", phone: "",
    company: "", industry: "", source: "", systemInterest: "", estimatedValue: "", notes: "",
  };
  mapping.forEach((field, i) => {
    if (field && row[i] !== undefined) lead[field] = row[i].trim();
  });
  return lead;
}

export default function LeadImportModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const BATCH_SIZE = 500;

  function handleFile(file: File) {
    setError("");
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file."); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (!headers.length) { setError("Could not parse CSV — check the file format."); return; }
      const mapping = mapHeaders(headers);
      const hasMappedField = mapping.some((m) => m !== null);
      if (!hasMappedField) { setError("No recognizable columns found. Check your CSV headers."); return; }
      const leads = rows.map((r) => rowToLead(r, mapping)).filter((l) => l.firstName || l.email);
      if (!leads.length) { setError("No valid rows found (need at least First Name or Email)."); return; }
      setParsedLeads(leads);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setStep("importing");
    setError("");

    const batches: ParsedLead[][] = [];
    for (let i = 0; i < parsedLeads.length; i += BATCH_SIZE) {
      batches.push(parsedLeads.slice(i, i + BATCH_SIZE));
    }
    setBatchProgress({ done: 0, total: batches.length });

    let totalInserted = 0;
    try {
      for (let i = 0; i < batches.length; i++) {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batches[i]),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        totalInserted += Array.isArray(data) ? data.length : batches[i].length;
        setBatchProgress({ done: i + 1, total: batches.length });
      }
      setImportedCount(totalInserted);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    }
  }

  const modal = (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-scale-in" style={panel}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Import Leads</h2>
            <p style={subtitleStyle}>
              {step === "upload" && "Upload a CSV file"}
              {step === "preview" && `${parsedLeads.length} leads ready to import`}
              {step === "importing" && `Batch ${batchProgress.done}/${batchProgress.total} — ${batchProgress.total > 0 ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0}%`}
              {step === "done" && `${importedCount} leads imported`}
            </p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>

          {/* STEP: Upload */}
          {step === "upload" && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                style={{ border: "2px dashed rgba(124,58,237,0.3)", borderRadius: 16, padding: "48px 32px", textAlign: "center", cursor: "pointer", background: "rgba(124,58,237,0.04)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.6)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.3)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.04)"; }}
              >
                <Upload size={28} color="rgba(124,58,237,0.6)" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "white", fontWeight: 500, fontSize: 14, marginBottom: 6 }}>Drop your CSV here or click to browse</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Accepts .csv files. Any column order works.</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Recognized column names</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["First Name", "Last Name", "Email", "Phone", "Company", "Industry", "Source", "System Interest", "Estimated Value", "Notes"].map((h) => (
                    <span key={h} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(124,58,237,0.12)", color: "rgba(167,139,250,0.8)", border: "1px solid rgba(124,58,237,0.2)" }}>{h}</span>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>Variations like <code style={{ color: "rgba(255,255,255,0.4)" }}>first_name</code>, <code style={{ color: "rgba(255,255,255,0.4)" }}>FirstName</code>, <code style={{ color: "rgba(255,255,255,0.4)" }}>mobile</code> etc. are all auto-mapped.</p>
              </div>

              {error && <p style={errorStyle}><AlertCircle size={13} style={{ flexShrink: 0 }} />{error}</p>}
            </div>
          )}

          {/* STEP: Preview */}
          {step === "preview" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 10 }}>
                <FileText size={14} color="#86efac" />
                <span style={{ fontSize: 13, color: "#86efac", fontWeight: 500 }}>{fileName}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{parsedLeads.length} rows</span>
              </div>

              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      {["First Name", "Last Name", "Email", "Phone", "Company"].map((h) => (
                        <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedLeads.slice(0, 8).map((l, i) => (
                      <tr key={i} style={{ borderBottom: i < Math.min(parsedLeads.length, 8) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td style={tdStyle}>{l.firstName || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                        <td style={tdStyle}>{l.lastName || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                        <td style={tdStyle}>{l.email || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                        <td style={tdStyle}>{l.phone || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                        <td style={tdStyle}>{l.company || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedLeads.length > 8 && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 10, textAlign: "center" }}>+ {parsedLeads.length - 8} more rows not shown</p>
              )}
              {error && <p style={errorStyle}><AlertCircle size={13} style={{ flexShrink: 0 }} />{error}</p>}
            </div>
          )}

          {/* STEP: Importing */}
          {step === "importing" && (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7C3AED", animation: "spin 0.7s linear infinite", margin: "0 auto 20px" }} />
              <p style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                Importing {parsedLeads.length.toLocaleString()} leads...
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>
                Batch {batchProgress.done} of {batchProgress.total}
              </p>
              {/* Progress bar */}
              <div style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #7C3AED, #A855F7)",
                  width: `${batchProgress.total > 0 ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 10 }}>
                {batchProgress.total > 0 ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0}% complete
              </p>
            </div>
          )}

          {/* STEP: Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <CheckCircle2 size={44} color="#22c55e" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "white", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{importedCount} leads imported</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>They're now in your pipeline.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={footerStyle}>
          {step === "upload" && (
            <button onClick={onClose} style={cancelBtn}>Cancel</button>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => { setStep("upload"); setParsedLeads([]); setFileName(""); }} style={cancelBtn}>Back</button>
              <button onClick={handleImport} style={saveBtn}>Import {parsedLeads.length} Leads</button>
            </>
          )}
          {step === "done" && (
            <button onClick={() => { onImported(); onClose(); }} style={{ ...saveBtn, flex: 1 }}>Done</button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 };
const panel: React.CSSProperties = { width: "calc(100vw - 32px)", maxWidth: 720, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#0f0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)" };
const headerStyle: React.CSSProperties = { flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" };
const bodyStyle: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "24px 28px" };
const footerStyle: React.CSSProperties = { flexShrink: 0, display: "flex", gap: 10, padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.07)" };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "-0.03em", marginBottom: 3 };
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: "rgba(124,58,237,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4, marginTop: -2 };
const tdStyle: React.CSSProperties = { padding: "9px 12px", fontSize: 12.5, color: "rgba(255,255,255,0.75)" };
const cancelBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const saveBtn: React.CSSProperties = { flex: 2, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #A855F7)", border: "none", color: "white", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" };
const errorStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, marginTop: 14 };
