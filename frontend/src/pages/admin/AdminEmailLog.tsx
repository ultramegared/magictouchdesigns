import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

type Log = {
  id: string;
  template_key: string;
  event_key?: string;
  recipient: string;
  provider: string;
  provider_message_id?: string;
  status: string;
  error_message?: string;
  created_at: string;
};

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "sent" || value === "delivered") return "email-log__badge email-log__badge--success";
  if (value === "failed" || value === "error" || value === "bounced") return "email-log__badge email-log__badge--error";
  return "email-log__badge email-log__badge--neutral";
}

export default function AdminEmailLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void apiRequest<any>("/api/admin/email-templates/logs?limit=200")
      .then((response) => setLogs(response.logs || []))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load email log."));
  }, []);

  return (
    <div className="admin-layout email-log-page">
      <AdminSidebar />
      <main className="admin-settings email-log-main">
        <style>{`
          .email-log-main, .email-log-main * { box-sizing: border-box; }
          .email-log-main { min-width: 0; width: 100%; }
          .email-log__intro { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
          .email-log__eyebrow { display:inline-block; margin-bottom:8px; color:#5474a5; font-size:11px; font-weight:800; letter-spacing:.14em; }
          .email-log__subtitle { max-width:650px; margin-top:8px; color:#64748b; line-height:1.55; }
          .email-log__summary { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
          .email-log__summary span { display:inline-flex; align-items:center; gap:7px; padding:7px 11px; border:1px solid #dbe4f0; border-radius:999px; background:#fff; color:#334155; font-size:12px; font-weight:700; }
          .email-log__panel { overflow:hidden; border:1px solid #dce4ef; border-radius:18px; background:#fff; box-shadow:0 8px 28px rgba(15,23,42,.05); }
          .email-log__panel-heading { padding:18px 20px; border-bottom:1px solid #e8edf4; }
          .email-log__panel-heading h2 { margin:0; color:#152238; font-size:16px; font-weight:800; }
          .email-log__panel-heading p { margin:5px 0 0; color:#718096; font-size:12px; }
          .email-log__table-wrap { width:100%; overflow-x:auto; }
          .email-log__table { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; }
          .email-log__table th { padding:13px 14px; background:#f7f9fc; color:#64748b; text-align:left; font-size:10px; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
          .email-log__table td { padding:14px; border-top:1px solid #edf1f6; color:#263449; vertical-align:top; overflow-wrap:anywhere; }
          .email-log__table tr:hover td { background:#fafcff; }
          .email-log__badge { display:inline-flex; align-items:center; padding:5px 9px; border-radius:999px; font-size:11px; font-weight:800; letter-spacing:.02em; white-space:nowrap; }
          .email-log__badge--success { background:#e8f8ef; color:#167447; }
          .email-log__badge--error { background:#fff0ef; color:#b42318; }
          .email-log__badge--neutral { background:#eef2f7; color:#475569; }
          .email-log__error { margin-top:7px; color:#b42318; font-size:12px; line-height:1.4; }
          .email-log__id { display:block; max-width:220px; color:#52637a; font-size:11px; line-height:1.45; overflow-wrap:anywhere; }
          .email-log__cards { display:none; }
          .email-log__empty { padding:28px 18px; color:#64748b; text-align:center; }
          @media (max-width: 700px) {
            .email-log-page { display:block; }
            .email-log-main { padding:16px 12px 28px !important; overflow-x:clip; }
            .email-log-main .admin-settings__hero { padding:20px 16px; border-radius:16px; }
            .email-log__intro { display:block; }
            .email-log__intro h1 { font-size:25px !important; line-height:1.15; overflow-wrap:anywhere; }
            .email-log__subtitle { font-size:13px; }
            .email-log__summary { gap:6px; margin-top:12px; }
            .email-log__summary span { padding:6px 9px; font-size:11px; }
            .email-log__panel { border-radius:15px; }
            .email-log__panel-heading { padding:15px; }
            .email-log__table-wrap { display:none; }
            .email-log__cards { display:grid; gap:10px; padding:10px; }
            .email-log__card { min-width:0; padding:14px; border:1px solid #e2e8f0; border-radius:13px; background:linear-gradient(180deg,#fff 0%,#fbfcff 100%); }
            .email-log__card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px; }
            .email-log__card-date { color:#64748b; font-size:11px; line-height:1.4; }
            .email-log__card-label { margin:11px 0 4px; color:#8491a3; font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
            .email-log__card-value { color:#253247; font-size:13px; line-height:1.45; overflow-wrap:anywhere; word-break:break-word; }
            .email-log__card-recipient { font-size:14px; font-weight:750; }
            .email-log__id { max-width:none; }
          }
        `}</style>
        <section className="admin-settings__hero">
          <div className="email-log__intro">
            <div>
              <span className="email-log__eyebrow">EMAIL MANAGEMENT</span>
              <h1>Email Log</h1>
              <p className="email-log__subtitle">Delivery history for emails sent through the reusable template system.</p>
              <div className="email-log__summary">
                <span>{logs.length} records</span>
                <span>{logs.filter((log) => ["sent", "delivered"].includes(log.status.toLowerCase())).length} sent</span>
                <span>{logs.filter((log) => ["failed", "error", "bounced"].includes(log.status.toLowerCase())).length} failed</span>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-settings__container">
          {message && <div className="admin-settings__message">{message}</div>}
          <article className="email-log__panel">
            <div className="email-log__panel-heading">
              <h2>Email delivery history</h2>
              <p>Review the status, provider response and any error for each message.</p>
            </div>
            {logs.length === 0 && !message ? (
              <div className="email-log__empty">No templated email deliveries recorded yet.</div>
            ) : (
              <>
                <div className="email-log__table-wrap">
                  <table className="email-log__table">
                    <thead><tr>{["Date", "Template", "Event", "Recipient", "Provider", "Message ID", "Status"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.created_at).toLocaleString()}</td>
                          <td>{log.template_key}</td>
                          <td>{log.event_key || "—"}</td>
                          <td>{log.recipient}</td>
                          <td>{log.provider}</td>
                          <td><span className="email-log__id">{log.provider_message_id || "—"}</span></td>
                          <td><span className={statusClass(log.status)}>{log.status}</span>{log.error_message && <div className="email-log__error">{log.error_message}</div>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="email-log__cards">
                  {logs.map((log) => (
                    <article className="email-log__card" key={log.id}>
                      <div className="email-log__card-top">
                        <div>
                          <div className="email-log__card-date">{new Date(log.created_at).toLocaleString()}</div>
                          <div className="email-log__card-label">Recipient</div>
                          <div className="email-log__card-value email-log__card-recipient">{log.recipient}</div>
                        </div>
                        <span className={statusClass(log.status)}>{log.status}</span>
                      </div>
                      <div className="email-log__card-label">Template / Event</div>
                      <div className="email-log__card-value">{log.template_key} · {log.event_key || "No event"}</div>
                      <div className="email-log__card-label">Provider</div>
                      <div className="email-log__card-value">{log.provider}</div>
                      <div className="email-log__card-label">Message ID</div>
                      <div className="email-log__card-value email-log__id">{log.provider_message_id || "—"}</div>
                      {log.error_message && <div className="email-log__error">{log.error_message}</div>}
                    </article>
                  ))}
                </div>
              </>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
