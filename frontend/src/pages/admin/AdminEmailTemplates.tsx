import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

function AdminEmailTemplates() {
  const [username, setUsername] = useState("Administrator");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void apiRequest<any>("/api/user/me").then((r) => setUsername(r.user?.username || "Administrator")).catch(() => {});
    void apiRequest<any>("/api/settings").then((r) => {
      const t = r.settings?.config?.emailTemplates?.customMug || {};
      setSubject(t.subject || "");
      setTitle(t.title || "");
    }).catch((e) => setMessage(e instanceof Error ? e.message : "Unable to load email template."));
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");
      const r = await apiRequest<any>("/api/settings");
      const config = r.settings.config || {};
      const emailTemplates = config.emailTemplates || {};
      const customMug = { ...(emailTemplates.customMug || {}), subject, title };
      await apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          websiteName: r.settings.websiteName,
          browserTitle: r.settings.browserTitle,
          logoUrl: r.settings.logoUrl,
          supportEmail: r.settings.supportEmail,
          notificationsEnabled: r.settings.notificationsEnabled,
          config: { emailTemplates: { ...emailTemplates, customMug } },
        }),
      });
      setMessage("Email template saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save email template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar username={username} />
      <main className="admin-settings">
        <section className="admin-settings__hero">
          <div>
            <span>EMAIL MANAGEMENT</span>
            <h1>Email Templates</h1>
            <p>Automatic email templates are managed here, separately from Settings.</p>
          </div>
        </section>
        <section className="admin-settings__container">
          {message && <div className="admin-settings__message">{message}</div>}
          <article className="admin-settings__section is-open">
            <header className="admin-settings__section-head">
              <div><small>TRANSACTIONAL</small><h2>Custom Mug Request</h2><p>Event: <strong>custom_mug.created</strong></p></div>
            </header>
            <div className="admin-settings__grid">
              <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
              <label className="full">Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            </div>
            <button type="button" className="admin-settings__add" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save Template"}
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}

export default AdminEmailTemplates;
