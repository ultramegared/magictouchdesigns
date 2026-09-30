import { useEffect, useState } from "react";
import { Mail, Save, RefreshCw } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

type EmailTemplate = {
  subject:string; eyebrow:string; title:string; intro:string;
  shippingText:string; paymentButton:string; pendingText:string;
  footerText:string; primaryColor:string; logoUrl:string;
};
type SettingsData = {
  websiteName:string; browserTitle:string; slogan:string; logoUrl:string|null;
  supportEmail:string; notificationsEnabled:boolean;
  config:{ emailTemplates:{ customMug:EmailTemplate }; [key:string]:unknown };
};

const defaults:EmailTemplate={
  subject:"JQYDesigns | Your Custom Mug Request {{requestCode}}",
  eyebrow:"CUSTOM MUG REQUEST",
  title:"Your custom mug request has been received.",
  intro:"Hi {{customerName}}, your design request has been saved and is ready for the next step.",
  shippingText:"Your shipping cost and applicable sales tax will be calculated automatically after you enter your delivery address at checkout.",
  paymentButton:"CONTINUE TO SECURE CHECKOUT",
  pendingText:"Your order has not been charged yet. Your purchase will only be confirmed after payment is successfully completed.",
  footerText:"Need help? Contact us at {{supportEmail}}",
  primaryColor:"#1764b1",
  logoUrl:""
};

function AdminEmailTemplates(){
  const [user,setUser]=useState("Administrator");
  const [settings,setSettings]=useState<SettingsData|null>(null);
  const [template,setTemplate]=useState<EmailTemplate>(defaults);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  const load=()=>{
    setMessage("");
    apiRequest<{status:string;user:{username:string}}>("/api/user/me").then(r=>setUser(r.user.username)).catch(()=>{});
    apiRequest<{status:string;settings:SettingsData}>(`/api/settings?email_templates_refresh=${Date.now()}`,{cache:"no-store"})
      .then(r=>{
        setSettings(r.settings);
        setTemplate({...defaults,...(r.settings.config.emailTemplates?.customMug||{})});
      })
      .catch(e=>setMessage(e instanceof Error?e.message:"Unable to load email templates."));
  };
  useEffect(load,[]);

  const update=(patch:Partial<EmailTemplate>)=>setTemplate(v=>({...v,...patch}));

  const save=async()=>{
    if(!settings)return;
    try{
      setSaving(true);setMessage("");
      const config={...settings.config,emailTemplates:{...settings.config.emailTemplates,customMug:template}};
      const r=await apiRequest<{status:string;settings:SettingsData}>("/api/settings",{
        method:"PUT",
        body:JSON.stringify({
          websiteName:settings.websiteName,
          browserTitle:settings.browserTitle,
          logoUrl:settings.logoUrl,
          supportEmail:settings.supportEmail,
          notificationsEnabled:settings.notificationsEnabled,
          config:{emailTemplates:config.emailTemplates}
        })
      });
      setSettings(r.settings);
      setTemplate({...defaults,...(r.settings.config.emailTemplates?.customMug||{})});
      setMessage("Email template saved and verified on the server.");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save email template.");}
    finally{setSaving(false);}
  };

  if(!settings)return <><AdminSidebar username={user}/><main className="admin-settings"><div className="admin-settings__loading"><span>Loading Email Templates…</span></div></main>;

  return <div className="admin-layout">
    <AdminSidebar username={user}/>
    <main className="admin-settings">
      <section className="admin-settings__hero">
        <div><span>EMAIL MANAGEMENT</span><h1>Email Templates</h1><p>Manage automatic customer email presentation separately from website Settings. Payment, security and event decisions remain controlled by the backend.</p></div>
        <Mail size={42}/>
      </section>
      <section className="admin-settings__container">
        {message&&<div className="admin-settings__message">{message}</div>}
        <article className="admin-settings__section is-open">
          <header className="admin-settings__section-head"><div><small>TRANSACTIONAL</small><h2>Custom Mug Request</h2><p>Event: <strong>custom_mug.created</strong> · Customer confirmation</p></div><span>ACTIVE</span></header>
          <div className="admin-settings__grid">
            <label>Subject<input value={template.subject} onChange={e=>update({subject:e.target.value})}/></label>
            <label>Eyebrow / Label<input value={template.eyebrow} onChange={e=>update({eyebrow:e.target.value})}/></label>
            <label className="full">Title<input value={template.title} onChange={e=>update({title:e.target.value})}/></label>
            <label className="full">Intro / Greeting<textarea value={template.intro} onChange={e=>update({intro:e.target.value})}/></label>
            <label className="full">Shipping &amp; Tax Message<textarea value={template.shippingText} onChange={e=>update({shippingText:e.target.value})}/></label>
            <label>Checkout Button<input value={template.paymentButton} onChange={e=>update({paymentButton:e.target.value})}/></label>
            <label>Button / Accent Color<input value={template.primaryColor} onChange={e=>update({primaryColor:e.target.value})}/></label>
            <label className="full">Pending Payment Message<textarea value={template.pendingText} onChange={e=>update({pendingText:e.target.value})}/></label>
            <label className="full">Footer Message<textarea value={template.footerText} onChange={e=>update({footerText:e.target.value})}/></label>
            <label className="full">Email Logo URL<input value={template.logoUrl} placeholder="Leave blank to use Website Logo" onChange={e=>update({logoUrl:e.target.value})}/></label>
          </div>
          <div className="admin-settings__card"><strong>Valid variables</strong><p style={{margin:"8px 0 0"}}><code>{"{{customerName}}"}</code> <code>{"{{requestCode}}"}</code> <code>{"{{supportEmail}}"}</code> <code>{"{{paymentUrl}}"}</code></p><small>Only these variables are supported by this template. Do not place payment or security logic in editable content.</small></div>
          <div style={{display:"flex",gap:12,marginTop:18}}>
            <button type="button" className="admin-settings__save" disabled={saving} onClick={save}>{saving?<RefreshCw size={17}/>:<Save size={17}/>} {saving?"Saving…":"Save Template"}</button>
            <button type="button" className="admin-settings__add" onClick={load}>Reload</button>
          </div>
        </article>
      </section>
    </main>
  </div>;
}
export default AdminEmailTemplates;
