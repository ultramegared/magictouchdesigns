import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

type Content = {
    subject:string; preheader:string; eyebrow:string; title:string; body:string;
    buttonText:string; buttonUrl:string; footerText:string; primaryColor:string;
};
type Template = {
    key:string; name:string; category:string; description:string; enabled:boolean;
    version:number; draft:Content; published:Content;
};
const SAMPLE:Record<string,string> = {
    siteName:"JQYDesigns", customerName:"Jose", customerEmail:"customer@example.com",
    supportEmail:"jqydesigns@gmail.com", requestCode:"REQ-2026-001", orderCode:"#1001",
    orderTotal:"$24.99", subtotal:"$19.99", shipping:"$5.00", tax:"$0.00",
    orderItems:"Custom Mug × 1 — $19.99", shippingAddress:"123 Example St, Houston, TX 77001",
    carrier:"USPS", trackingNumber:"9400111899223856920000", trackingUrl:"https://tools.usps.com/",
    orderUrl:"https://www.jqydesigns.com/track-order", accountUrl:"https://www.jqydesigns.com/account",
    paymentUrl:"https://www.jqydesigns.com/checkout", resetUrl:"https://www.jqydesigns.com/reset-password?token=TEST",
    verificationUrl:"https://www.jqydesigns.com/account", expiryMinutes:"30", mugModel:"Premium", mugSize:"15 oz",
    mugColor:"White", printSides:"Front + Back", quantity:"1", shippingText:"Shipping and applicable tax are calculated at checkout.",
    pendingText:"Your order has not been charged yet.", paymentProvider:"Stripe", refundAmount:"$24.99",
    updateMessage:"This is a sample update.", contactUrl:"https://www.jqydesigns.com/contact",
    message:"This is a sample customer message.", promotionSubject:"Summer Promotion", promotionTitle:"Summer Collection",
    promotionMessage:"Discover our latest personalized designs.", promotionButtonText:"Shop Now", promotionUrl:"https://www.jqydesigns.com/products"
};
const render = (value:string) => value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_m,k) => SAMPLE[k] || "{{"+k+"}}");

function AdminEmailTemplates() {
    const [templates,setTemplates]=useState<Template[]>([]);
    const [selected,setSelected]=useState("");
    const [draft,setDraft]=useState<Content|null>(null);
    const [enabled,setEnabled]=useState(true);
    const [logoUrl,setLogoUrl]=useState("");
    const [message,setMessage]=useState("");
    const [testTo,setTestTo]=useState("");
    const [preview,setPreview]=useState(false);
    const [busy,setBusy]=useState(false);

    const load=async()=>{
        const [emailResult,settingsResult]=await Promise.all([
            apiRequest<any>("/api/admin/email-templates"),
            apiRequest<any>("/api/settings")
        ]);
        const list=Object.values(emailResult.templates || {}) as Template[];
        setTemplates(list);
        setLogoUrl(settingsResult.settings?.logoUrl || "");
        const first=list[0];
        if(first){setSelected(first.key);setDraft(first.draft);setEnabled(first.enabled);}
    };
    useEffect(()=>{void load().catch(e=>setMessage(e instanceof Error?e.message:"Unable to load templates."));},[]);
    const current=templates.find(t=>t.key===selected);
    const choose=(key:string)=>{
        const item=templates.find(t=>t.key===key);
        if(!item)return;
        setSelected(key);setDraft(item.draft);setEnabled(item.enabled);setPreview(false);setMessage("");
    };
    const update=(field:keyof Content,value:string)=>setDraft(d=>d?({...d,[field]:value}):d);
    const save=async()=>{
        if(!draft||!current)return;
        setBusy(true);setMessage("");
        try{
            const r=await apiRequest<any>("/api/admin/email-templates/"+current.key,{method:"PUT",body:JSON.stringify({...draft,enabled})});
            setTemplates(ts=>ts.map(t=>t.key===current.key?{...t,draft:r.template.draft,enabled:r.template.enabled}:t));
            setDraft(r.template.draft);setMessage("Draft saved.");
        }catch(e){setMessage(e instanceof Error?e.message:"Unable to save draft.");}finally{setBusy(false);}
    };
    const publish=async()=>{
        if(!current)return;
        setBusy(true);setMessage("");
        try{
            const r=await apiRequest<any>("/api/admin/email-templates/"+current.key+"/publish",{method:"POST"});
            setTemplates(ts=>ts.map(t=>t.key===current.key?{...t,published:r.template.published,draft:r.template.draft,version:r.template.version}:t));
            setDraft(r.template.draft);setMessage("Template published. New emails now use this version.");
        }catch(e){setMessage(e instanceof Error?e.message:"Unable to publish template.");}finally{setBusy(false);}
    };
    const sendTest=async()=>{
        if(!current||!testTo.trim()){setMessage("Enter a test recipient email.");return;}
        setBusy(true);setMessage("");
        try{const r=await apiRequest<any>("/api/admin/email-templates/"+current.key+"/test",{method:"POST",body:JSON.stringify({to:testTo.trim()})});setMessage("Test email sent. Message ID: "+(r.id||"provider response"));}catch(e){setMessage(e instanceof Error?e.message:"Unable to send test.");}finally{setBusy(false);}
    };
    const previewContent=useMemo(()=>draft?Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,render(String(v))])) as Content:null,[draft]);
    const fields:[keyof Content,string,boolean][]=[
        ["subject","Subject",false],["preheader","Preheader",false],["eyebrow","Eyebrow",false],["title","Title",false],
        ["body","Body",true],["buttonText","Button Text",false],["buttonUrl","Button URL",false],["footerText","Footer",true],["primaryColor","Primary Color",false]
    ];
    return <div className="admin-layout"><AdminSidebar />
        <main className="admin-settings">
            <section className="admin-settings__hero"><div><span>EMAIL MANAGEMENT</span><h1>Email Templates</h1><p>Real transactional and marketing templates using the existing Resend delivery service. Published content controls live emails.</p></div></section>
            <section className="admin-settings__container">
                {message&&<div className="admin-settings__message">{message}</div>}
                <div style={{display:"grid",gridTemplateColumns:"260px minmax(0,1fr)",gap:18,alignItems:"start"}}>
                    <aside className="admin-settings__section is-open" style={{position:"sticky",top:18}}>
                        <h2 style={{marginTop:0}}>Templates</h2>
                        {templates.map(t=><button key={t.key} type="button" onClick={()=>choose(t.key)} style={{display:"block",width:"100%",textAlign:"left",padding:"11px 12px",margin:"5px 0",borderRadius:10,border:t.key===selected?"2px solid var(--skin-primary)":"1px solid rgba(127,127,127,.18)",background:t.key===selected?"rgba(31,103,177,.08)":"transparent",cursor:"pointer"}}><strong>{t.name}</strong><small style={{display:"block",opacity:.65,marginTop:3}}>{t.category}</small></button>)}
                    </aside>
                    <div>
                        {current&&draft&&<article className="admin-settings__section is-open">
                            <header className="admin-settings__section-head"><div><small>{current.category}</small><h2>{current.name}</h2><p>{current.description} · Published version {current.version}</p></div><label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Enabled</label></header>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                                {fields.map(([field,label,multi])=><label key={field} style={{display:"block",gridColumn:multi?"1 / -1":"auto"}}>{label}{multi?<textarea rows={field==="body"?9:4} value={draft[field]} onChange={e=>update(field,e.target.value)} />:<input value={draft[field]} onChange={e=>update(field,e.target.value)} />}</label>)}
                            </div>
                            <div style={{marginTop:16,padding:14,border:"1px solid rgba(127,127,127,.18)",borderRadius:12}}>
                                <strong>Variables</strong>
                                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:9}}>{Object.keys(SAMPLE).map(k=><code key={k}>{"{{"+k+"}}"}</code>)}</div>
                            </div>
                            <div style={{display:"flex",gap:9,flexWrap:"wrap",marginTop:16}}>
                                <button type="button" className="admin-settings__add" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save Draft"}</button>
                                <button type="button" className="admin-settings__add" disabled={busy} onClick={()=>void publish()}>Publish</button>
                                <button type="button" className="admin-settings__add" disabled={busy} onClick={()=>setPreview(v=>!v)}>{preview?"Hide Preview":"Preview"}</button>
                                <input style={{minWidth:240}} placeholder="test@email.com" value={testTo} onChange={e=>setTestTo(e.target.value)} />
                                <button type="button" className="admin-settings__add" disabled={busy} onClick={()=>void sendTest()}>Send Test</button>
                            </div>
                            {preview&&previewContent&&<div style={{marginTop:20,border:"1px solid #dfe5ed",borderRadius:16,overflow:"hidden",background:"#fff",color:"#172033"}}>
                                <div style={{padding:"22px",borderBottom:"1px solid #e7ebf1",textAlign:"center"}}>{logoUrl?<img src={logoUrl} alt="Site logo" style={{maxWidth:220,maxHeight:82}}/>:<strong>JQYDesigns</strong>}</div>
                                <div style={{padding:28}}><div style={{color:previewContent.primaryColor,fontWeight:800,letterSpacing:1.4,fontSize:12}}>{previewContent.eyebrow}</div><h1>{previewContent.title}</h1><p style={{whiteSpace:"pre-wrap",lineHeight:1.7,color:"#526071"}}>{previewContent.body}</p>{previewContent.buttonText&&previewContent.buttonUrl&&<p><a href={previewContent.buttonUrl} style={{display:"inline-block",padding:"13px 20px",background:previewContent.primaryColor,color:"#fff",borderRadius:10,textDecoration:"none",fontWeight:700}}>{previewContent.buttonText}</a></p>}<p style={{whiteSpace:"pre-wrap",borderTop:"1px solid #e7ebf1",paddingTop:18,color:"#6b7280",fontSize:12}}>{previewContent.footerText}</p></div>
                            </div>}
                        </article>}
                    </div>
                </div>
            </section>
        </main>
    </div>;
}
export default AdminEmailTemplates;
