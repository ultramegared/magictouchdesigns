import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

type CustomMugTemplate = {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  shippingText: string;
  paymentButton: string;
  pendingText: string;
  footerText: string;
  primaryColor: string;
  logoUrl: string;
};

const DEFAULT_TEMPLATE: CustomMugTemplate = {
  subject: "Your custom mug request {{requestCode}}",
  eyebrow: "CUSTOM DESIGN REQUEST",
  title: "Your custom mug request has been received.",
  intro: "Hi {{customerName}}, we received your design request and reserved your custom order details.",
  shippingText: "USPS shipping and applicable sales tax will be calculated after you enter your delivery address at checkout.",
  paymentButton: "Continue to Secure Checkout",
  pendingText: "Your order has not been charged yet. Your purchase will only be confirmed after payment is successfully completed.",
  footerText: "Need help? Contact us at {{supportEmail}}",
  primaryColor: "#1F67B1",
  logoUrl: "",
};

const SAMPLE_VALUES: Record<string, string> = {
  "{{customerName}}": "Jose",
  "{{requestCode}}": "REQ-2026-001",
  "{{supportEmail}}": "jqydesigns@gmail.com",
  "{{paymentUrl}}": "https://www.jqydesigns.com/checkout",
};

const renderSample = (value: string) =>
  Object.entries(SAMPLE_VALUES).reduce(
    (result, [variable, sample]) => result.replaceAll(variable, sample),
    value,
  );

function AdminEmailTemplates() {
  const [username, setUsername] = useState("Administrator");
  const [template, setTemplate] = useState<CustomMugTemplate>(DEFAULT_TEMPLATE);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    void apiRequest<any>("/api/user/me")
      .then((r) => setUsername(r.user?.username || "Administrator"))
      .catch(() => {});

    void apiRequest<any>("/api/settings")
      .then((r) => {
        const saved = r.settings?.config?.emailTemplates?.customMug || {};
        setTemplate({ ...DEFAULT_TEMPLATE, ...saved });
      })
      .catch((e) =>
        setMessage(e instanceof Error ? e.message : "Unable to load email template."),
      );
  }, []);

  const updateField = (field: keyof CustomMugTemplate, value: string) => {
    setTemplate((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");
      const r = await apiRequest<any>("/api/settings");
      const config = r.settings.config || {};
      const emailTemplates = config.emailTemplates || {};

      await apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          websiteName: r.settings.websiteName,
          browserTitle: r.settings.browserTitle,
          logoUrl: r.settings.logoUrl,
          supportEmail: r.settings.supportEmail,
          notificationsEnabled: r.settings.notificationsEnabled,
          config: {
            emailTemplates: {
              ...emailTemplates,
              customMug: template,
            },
          },
        }),
      });

      setMessage("Email template saved successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save email template.");
    } finally {
      setSaving(false);
    }
  };

  const previewTemplate = useMemo(
    () => ({
      subject: renderSample(template.subject),
      eyebrow: renderSample(template.eyebrow),
      title: renderSample(template.title),
      intro: renderSample(template.intro),
      shippingText: renderSample(template.shippingText),
      paymentButton: renderSample(template.paymentButton),
      pendingText: renderSample(template.pendingText),
      footerText: renderSample(template.footerText),
    }),
    [template],
  );

  return (
    <div className="admin-layout">
      <AdminSidebar username={username} />

      <main className="admin-settings">
        <section className="admin-settings__hero">
          <div>
            <span>EMAIL MANAGEMENT</span>
            <h1>Email Templates</h1>
            <p>
              Edit the existing transactional email template without changing the
              email transport or delivery flow.
            </p>
          </div>
        </section>

        <section className="admin-settings__container">
          {message && <div className="admin-settings__message">{message}</div>}

          <article className="admin-settings__section is-open">
            <header className="admin-settings__section-head">
              <div>
                <small>TRANSACTIONAL</small>
                <h2>Custom Mug Request</h2>
                <p>
                  Event: <strong>custom_mug.created</strong>
                </p>
              </div>
            </header>

            <div className="admin-settings__grid">
              <label>
                Subject
                <input
                  value={template.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                />
              </label>

              <label>
                Eyebrow
                <input
                  value={template.eyebrow}
                  onChange={(e) => updateField("eyebrow", e.target.value)}
                />
              </label>

              <label className="full">
                Title
                <input
                  value={template.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </label>

              <label className="full">
                Intro
                <textarea
                  rows={4}
                  value={template.intro}
                  onChange={(e) => updateField("intro", e.target.value)}
                />
              </label>

              <label className="full">
                Shipping Text
                <textarea
                  rows={3}
                  value={template.shippingText}
                  onChange={(e) => updateField("shippingText", e.target.value)}
                />
              </label>

              <label>
                Payment Button
                <input
                  value={template.paymentButton}
                  onChange={(e) => updateField("paymentButton", e.target.value)}
                />
              </label>

              <label>
                Primary Color
                <input
                  type="text"
                  value={template.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  placeholder="#1F67B1"
                />
              </label>

              <label className="full">
                Pending / Payment Notice
                <textarea
                  rows={3}
                  value={template.pendingText}
                  onChange={(e) => updateField("pendingText", e.target.value)}
                />
              </label>

              <label className="full">
                Footer Text
                <textarea
                  rows={3}
                  value={template.footerText}
                  onChange={(e) => updateField("footerText", e.target.value)}
                />
              </label>

              <label className="full">
                Logo URL
                <input
                  value={template.logoUrl}
                  onChange={(e) => updateField("logoUrl", e.target.value)}
                  placeholder="Optional — leave empty to keep the current email logo"
                />
              </label>
            </div>

            <div style={{ marginTop: 18, padding: 16, border: "1px solid rgba(127,127,127,.18)", borderRadius: 12 }}>
              <strong>Available variables</strong>
              <p style={{ margin: "8px 0 0", lineHeight: 1.7 }}>
                <code>{"{{customerName}}"}</code>{" "}
                <code>{"{{requestCode}}"}</code>{" "}
                <code>{"{{supportEmail}}"}</code>{" "}
                <code>{"{{paymentUrl}}"}</code>
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button
                type="button"
                className="admin-settings__add"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "Saving…" : "Save Template"}
              </button>

              <button
                type="button"
                className="admin-settings__add"
                onClick={() => setPreview((current) => !current)}
              >
                {preview ? "Hide Preview" : "Preview Email"}
              </button>
            </div>
          </article>

          {preview && (
            <article className="admin-settings__section is-open" style={{ marginTop: 18 }}>
              <header className="admin-settings__section-head">
                <div>
                  <small>LIVE PREVIEW</small>
                  <h2>{previewTemplate.subject}</h2>
                </div>
              </header>

              <div
                style={{
                  maxWidth: 680,
                  margin: "0 auto",
                  background: "#fff",
                  color: "#172033",
                  border: "1px solid #dfe5ed",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "12px 24px", borderBottom: "1px solid #e7ebf1", fontSize: 12 }}>
                  Thank you for choosing JQYDesigns!
                </div>

                <div style={{ padding: "24px 26px" }}>
                  {template.logoUrl ? (
                    <img
                      src={template.logoUrl}
                      alt="Email logo"
                      style={{ display: "block", maxWidth: 210, maxHeight: 80, objectFit: "contain" }}
                    />
                  ) : (
                    <strong>JQYDesigns</strong>
                  )}
                </div>

                <div style={{ padding: "0 26px 22px" }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg,#eef5fc,#fff)",
                      border: "1px solid #dce7f4",
                      borderRadius: 16,
                      padding: "28px 26px",
                    }}
                  >
                    <div style={{ color: template.primaryColor, fontWeight: 800, letterSpacing: 1.4, fontSize: 12 }}>
                      {previewTemplate.eyebrow}
                    </div>
                    <h1 style={{ margin: "10px 0", fontSize: 30 }}>{previewTemplate.title}</h1>
                    <p style={{ margin: 0, color: "#526071", lineHeight: 1.65 }}>
                      {previewTemplate.intro}
                    </p>
                  </div>
                </div>

                <div style={{ padding: "0 26px 26px" }}>
                  <p>{previewTemplate.shippingText}</p>
                  <p>
                    <a
                      href="#preview"
                      style={{
                        display: "inline-block",
                        padding: "12px 18px",
                        background: template.primaryColor || "#1F67B1",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                      }}
                    >
                      {previewTemplate.paymentButton}
                    </a>
                  </p>
                  <p style={{ color: "#526071" }}>{previewTemplate.pendingText}</p>
                  <p style={{ color: "#6b7280", marginTop: 24 }}>{previewTemplate.footerText}</p>
                </div>
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminEmailTemplates;
