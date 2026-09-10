import { useEffect, useRef, useState } from "react";
import { Building2, Globe, Settings, Upload, Trash2, Plus, ChevronUp, ChevronDown, Save, Link2, UserRound, Share2, LayoutTemplate } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminSettings.css";

type LocalizedText = { en: string; es: string };
type HeroSlide = { id:string; image:string; background:string; order:number; active:boolean; title:LocalizedText; subtitle:LocalizedText; primaryButton:LocalizedText; primaryLink:string; secondaryButton:LocalizedText; secondaryLink:string };
type NavLink = { id:string; label:LocalizedText; path:string; active:boolean; order:number };
type FooterSection = { id:string; title:LocalizedText; links:NavLink[]; active:boolean; order:number };
type SocialLink = { id:string; name:string; url:string; active:boolean; order:number };
type PageConfig = { id:string; title:LocalizedText; slug:string; body:LocalizedText; active:boolean };
type SiteConfig = { slogan:LocalizedText; designerName:LocalizedText; designerTitle:LocalizedText; designerBio:LocalizedText; businessPhone:string; businessAddress:string; heroSlides:HeroSlide[]; headerLinks:NavLink[]; footerSections:FooterSection[]; socialLinks:SocialLink[]; pages:PageConfig[] };
type SettingsData = { websiteName:string; browserTitle:string; slogan:string; logoUrl:string|null; supportEmail:string; notificationsEnabled:boolean; config:SiteConfig };

const emptyText = ():LocalizedText => ({ en:"", es:"" });
const emptyHero = (order:number):HeroSlide => ({ id:`hero-${Date.now()}`, image:"", background:"/images/hero/hero-background.jpg", order, active:true, title:emptyText(), subtitle:emptyText(), primaryButton:emptyText(), primaryLink:"/customize", secondaryButton:emptyText(), secondaryLink:"/products" });
const emptyLink = (order:number):NavLink => ({ id:`link-${Date.now()}`, label:emptyText(), path:"/", active:true, order });

function AdminSettings() {
    const [currentUser,setCurrentUser]=useState<{username:string}|null>(null);
    const [settings,setSettings]=useState<SettingsData|null>(null);
    const [websiteName,setWebsiteName]=useState("");
    const [browserTitle,setBrowserTitle]=useState("");
    const [logoUrl,setLogoUrl]=useState("");
    const [supportEmail,setSupportEmail]=useState("");
    const [notificationsEnabled,setNotificationsEnabled]=useState(true);
    const [saving,setSaving]=useState(false);
    const [message,setMessage]=useState("");
    const fileRef=useRef<HTMLInputElement>(null);

    useEffect(()=>{ apiRequest<{status:string;user:{username:string}}>("/api/user/me").then(r=>setCurrentUser(r.user)).catch(()=>{}); apiRequest<{status:string;settings:SettingsData}>("/api/settings").then(r=>{setSettings(r.settings);setWebsiteName(r.settings.websiteName);setBrowserTitle(r.settings.browserTitle);setLogoUrl(r.settings.logoUrl??"");setSupportEmail(r.settings.supportEmail);setNotificationsEnabled(r.settings.notificationsEnabled);}).catch(e=>setMessage(e instanceof Error?e.message:"Unable to load settings.")); },[]);

    const updateConfig=(patch:Partial<SiteConfig>)=>setSettings(prev=>prev?({...prev,config:{...prev.config,...patch}}):prev);
    const config=settings?.config;
    const updateHero=(index:number,patch:Partial<HeroSlide>)=>{if(!config)return;const items=[...config.heroSlides];items[index]={...items[index],...patch};updateConfig({heroSlides:items});};
    const moveHero=(index:number,direction:-1|1)=>{if(!config)return;const next=index+direction;if(next<0||next>=config.heroSlides.length)return;const items=[...config.heroSlides];[items[index],items[next]]=[items[next],items[index]];updateConfig({heroSlides:items.map((x,i)=>({...x,order:i+1}))});};
    const removeHero=(index:number)=>{if(!config)return;updateConfig({heroSlides:config.heroSlides.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};
    const updateHeader=(index:number,patch:Partial<NavLink>)=>{if(!config)return;const items=[...config.headerLinks];items[index]={...items[index],...patch};updateConfig({headerLinks:items});};
    const removeHeader=(index:number)=>{if(!config)return;updateConfig({headerLinks:config.headerLinks.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};
    const updateFooterLink=(sectionIndex:number,linkIndex:number,patch:Partial<NavLink>)=>{if(!config)return;const sections=[...config.footerSections];const links=[...sections[sectionIndex].links];links[linkIndex]={...links[linkIndex],...patch};sections[sectionIndex]={...sections[sectionIndex],links};updateConfig({footerSections:sections});};
    const removeFooterLink=(sectionIndex:number,linkIndex:number)=>{if(!config)return;const sections=[...config.footerSections];sections[sectionIndex]={...sections[sectionIndex],links:sections[sectionIndex].links.filter((_,i)=>i!==linkIndex).map((x,i)=>({...x,order:i+1}))};updateConfig({footerSections:sections});};
    const addFooterSection=()=>{if(!config)return;updateConfig({footerSections:[...config.footerSections,{id:`footer-${Date.now()}`,title:emptyText(),active:true,order:config.footerSections.length+1,links:[]}]});};
    const updateSocial=(index:number,patch:Partial<SocialLink>)=>{if(!config)return;const items=[...config.socialLinks];items[index]={...items[index],...patch};updateConfig({socialLinks:items});};
    const removeSocial=(index:number)=>{if(!config)return;updateConfig({socialLinks:config.socialLinks.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};

    const uploadLogo=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;try{const fd=new FormData();fd.append("image",file);const r=await apiRequest<{image_url:string}>("/api/upload/logo",{method:"POST",body:fd});setLogoUrl(r.image_url);setMessage("Logo uploaded. Save Settings to apply it.");}catch(err){setMessage(err instanceof Error?err.message:"Upload failed.");}finally{if(fileRef.current)fileRef.current.value="";}};

    const save=async()=>{if(!settings||!config)return;try{setSaving(true);setMessage("");const r=await apiRequest<{status:string;message:string;settings:SettingsData}>("/api/settings",{method:"PUT",body:JSON.stringify({websiteName,browserTitle,logoUrl:logoUrl||null,supportEmail,notificationsEnabled,config})});setSettings(r.settings);setWebsiteName(r.settings.websiteName);setBrowserTitle(r.settings.browserTitle);setLogoUrl(r.settings.logoUrl??"");setMessage("Settings saved successfully. Automatic English/Spanish translation is applied to changed content.");}catch(err){setMessage(err instanceof Error?err.message:"Unable to save settings.");}finally{setSaving(false);}};

    if(!settings||!config)return <><AdminSidebar username={currentUser?.username||"Administrator"}/><main className="admin-settings"><div className="admin-settings__loading">Loading Settings…</div></main></>;
    return <div className="admin-layout"><AdminSidebar username={currentUser?.username||"Administrator"}/><main className="admin-settings">
        <section className="admin-settings__hero"><div><span>ADMINISTRATION</span><h1>Settings</h1><p>Manage the complete public website from one place.</p></div><Settings size={42}/></section>
        <section className="admin-settings__container">
            {message&&<div className="admin-settings__message">{message}</div>}
            <section className="admin-settings__section"><header><Building2/><div><span>BRANDING</span><h2>Business & Website</h2></div></header><div className="admin-settings__card admin-settings__grid">
                <label>Store Name<input value={websiteName} onChange={e=>setWebsiteName(e.target.value)}/></label>
                <label>Browser Title<input value={browserTitle} onChange={e=>setBrowserTitle(e.target.value)}/></label>
                <label>Support Email<input type="email" value={supportEmail} onChange={e=>setSupportEmail(e.target.value)}/></label>
                <label>Business Phone<input value={config.businessPhone} onChange={e=>updateConfig({businessPhone:e.target.value})}/></label>
                <label>Business Address<input value={config.businessAddress} onChange={e=>updateConfig({businessAddress:e.target.value})}/></label>
                <label>Slogan (English)<input value={config.slogan.en} onChange={e=>updateConfig({slogan:{en:e.target.value,es:config.slogan.es}})}/></label>
                <div className="admin-settings__upload"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadLogo}/><button type="button" onClick={()=>fileRef.current?.click()}><Upload size={18}/> Upload Logo</button>{logoUrl&&<img src={logoUrl} alt={websiteName}/>}</div>
                <label className="admin-settings__toggle"><input type="checkbox" checked={notificationsEnabled} onChange={e=>setNotificationsEnabled(e.target.checked)}/> Administrative notifications enabled</label>
            </div></section>

            <section className="admin-settings__section"><header><LayoutTemplate/><div><span>HOME</span><h2>Hero Slider</h2></div><button className="admin-settings__add" onClick={()=>updateConfig({heroSlides:[...config.heroSlides,emptyHero(config.heroSlides.length+1)]})}><Plus size={17}/> Add Slider</button></header>
                <div className="admin-settings__list">{config.heroSlides.map((slide,i)=><article className="admin-settings__item" key={slide.id}><div className="admin-settings__item-top"><strong>Slider {i+1}</strong><div><button onClick={()=>moveHero(i,-1)} disabled={i===0}><ChevronUp/></button><button onClick={()=>moveHero(i,1)} disabled={i===config.heroSlides.length-1}><ChevronDown/></button><button className="danger" onClick={()=>removeHero(i)}><Trash2/></button></div></div>
                    <div className="admin-settings__grid"><label>Image URL<input value={slide.image} onChange={e=>updateHero(i,{image:e.target.value})}/></label><label>Background URL<input value={slide.background} onChange={e=>updateHero(i,{background:e.target.value})}/></label><label>Title (English)<textarea value={slide.title.en} onChange={e=>updateHero(i,{title:{...slide.title,en:e.target.value}})}/></label><label>Subtitle (English)<textarea value={slide.subtitle.en} onChange={e=>updateHero(i,{subtitle:{...slide.subtitle,en:e.target.value}})}/></label><label>Primary Button<input value={slide.primaryButton.en} onChange={e=>updateHero(i,{primaryButton:{...slide.primaryButton,en:e.target.value}})}/></label><label>Primary Link<input value={slide.primaryLink} onChange={e=>updateHero(i,{primaryLink:e.target.value})}/></label><label>Secondary Button<input value={slide.secondaryButton.en} onChange={e=>updateHero(i,{secondaryButton:{...slide.secondaryButton,en:e.target.value}})}/></label><label>Secondary Link<input value={slide.secondaryLink} onChange={e=>updateHero(i,{secondaryLink:e.target.value})}/></label><label className="admin-settings__toggle"><input type="checkbox" checked={slide.active} onChange={e=>updateHero(i,{active:e.target.checked})}/> Active</label></div>
                </article>)}</div></section>

            <section className="admin-settings__section"><header><Link2/><div><span>HEADER</span><h2>Navigation Pages</h2></div><button className="admin-settings__add" onClick={()=>updateConfig({headerLinks:[...config.headerLinks,emptyLink(config.headerLinks.length+1)]})}><Plus size={17}/> Add Page</button></header><div className="admin-settings__list">{config.headerLinks.map((link,i)=><article className="admin-settings__compact" key={link.id}><input value={link.label.en} placeholder="Page name" onChange={e=>updateHeader(i,{label:{...link.label,en:e.target.value}})}/><input value={link.path} placeholder="/path" onChange={e=>updateHeader(i,{path:e.target.value})}/><label><input type="checkbox" checked={link.active} onChange={e=>updateHeader(i,{active:e.target.checked})}/> Active</label><button className="danger" onClick={()=>removeHeader(i)}><Trash2/></button></article>)}</div></section>

            <section className="admin-settings__section"><header><Globe/><div><span>FOOTER</span><h2>Footer Sections & Pages</h2></div><button className="admin-settings__add" onClick={addFooterSection}><Plus size={17}/> Add Section</button></header><div className="admin-settings__list">{config.footerSections.map((section,si)=><article className="admin-settings__item" key={section.id}><div className="admin-settings__item-top"><strong><input value={section.title.en} onChange={e=>{const sections=[...config.footerSections];sections[si]={...sections[si],title:{...sections[si].title,en:e.target.value}};updateConfig({footerSections:sections});}}/></strong><button className="admin-settings__add" onClick={()=>{const sections=[...config.footerSections];sections[si]={...sections[si],links:[...sections[si].links,emptyLink(sections[si].links.length+1)]};updateConfig({footerSections:sections});}}><Plus size={16}/> Add Page</button></div>{section.links.map((link,li)=><div className="admin-settings__compact" key={link.id}><input value={link.label.en} onChange={e=>updateFooterLink(si,li,{label:{...link.label,en:e.target.value}})}/><input value={link.path} onChange={e=>updateFooterLink(si,li,{path:e.target.value})}/><label><input type="checkbox" checked={link.active} onChange={e=>updateFooterLink(si,li,{active:e.target.checked})}/> Active</label><button className="danger" onClick={()=>removeFooterLink(si,li)}><Trash2/></button></div>)}</article>)}</div></section>

            <section className="admin-settings__section"><header><Share2/><div><span>SOCIAL</span><h2>Social Networks</h2></div><button className="admin-settings__add" onClick={()=>updateConfig({socialLinks:[...config.socialLinks,{id:`social-${Date.now()}`,name:"New Network",url:"",active:true,order:config.socialLinks.length+1}]})}><Plus size={17}/> Add Network</button></header><div className="admin-settings__list">{config.socialLinks.map((social,i)=><article className="admin-settings__compact" key={social.id}><input value={social.name} onChange={e=>updateSocial(i,{name:e.target.value})}/><input value={social.url} placeholder="https://" onChange={e=>updateSocial(i,{url:e.target.value})}/><label><input type="checkbox" checked={social.active} onChange={e=>updateSocial(i,{active:e.target.checked})}/> Active</label><button className="danger" onClick={()=>removeSocial(i)}><Trash2/></button></article>)}</div></section>

            <section className="admin-settings__section"><header><UserRound/><div><span>DESIGNER</span><h2>Public Designer Information</h2></div></header><div className="admin-settings__card admin-settings__grid"><label>Name (English)<input value={config.designerName.en} onChange={e=>updateConfig({designerName:{...config.designerName,en:e.target.value}})}/></label><label>Title (English)<input value={config.designerTitle.en} onChange={e=>updateConfig({designerTitle:{...config.designerTitle,en:e.target.value}})}/></label><label className="full">Bio (English)<textarea value={config.designerBio.en} onChange={e=>updateConfig({designerBio:{...config.designerBio,en:e.target.value}})}/></label></div></section>

            <section className="admin-settings__save"><button onClick={save} disabled={saving}><Save size={18}/>{saving?"Saving…":"Save Settings"}</button></section>
        </section>
    </main></div>;
}
export default AdminSettings;
