import { useEffect, useRef, useState } from "react";
import { Building2, Globe, Settings, Upload, Trash2, Plus, ChevronUp, ChevronDown, Save, Link2, UserRound, Share2, LayoutTemplate, ChevronDown as Expand, ChevronUp as Collapse, X, Check } from "lucide-react";
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
type SectionKey = "branding" | "hero" | "header" | "footer" | "social" | "designer";

const emptyText = ():LocalizedText => ({ en:"", es:"" });
const emptyHero = (order:number):HeroSlide => ({ id:`hero-${Date.now()}`, image:"", background:"/images/hero/hero-background.jpg", order, active:true, title:emptyText(), subtitle:emptyText(), primaryButton:emptyText(), primaryLink:"/customize", secondaryButton:emptyText(), secondaryLink:"/products" });
const emptyLink = (order:number):NavLink => ({ id:`link-${Date.now()}`, label:emptyText(), path:"/", active:true, order });
const emptyPage = ():PageConfig => ({ id:`page-${Date.now()}`, title:emptyText(), slug:"new-page", body:emptyText(), active:true });

const syncPublicConfig = (config:SiteConfig) => {
    try {
        localStorage.setItem("mtd_site_config", JSON.stringify(config));
        window.dispatchEvent(new Event("mtd-site-config-updated"));
    } catch {}
};

function AdminSettings() {
    const [currentUser,setCurrentUser]=useState<{username:string}|null>(null);
    const [settings,setSettings]=useState<SettingsData|null>(null);
    const [websiteName,setWebsiteName]=useState("");
    const [browserTitle,setBrowserTitle]=useState("");
    const [logoUrl,setLogoUrl]=useState("");
    const [supportEmail,setSupportEmail]=useState("");
    const [notificationsEnabled,setNotificationsEnabled]=useState(true);
    const [open,setOpen]=useState<Record<SectionKey,boolean>>({branding:false,hero:false,header:false,footer:false,social:false,designer:false});
    const [saving,setSaving]=useState<SectionKey|null>(null);
    const [status,setStatus]=useState<Partial<Record<SectionKey,string>>>({});
    const [message,setMessage]=useState("");
    const [pendingLogo,setPendingLogo]=useState<File|null>(null);
    const [logoPreview,setLogoPreview]=useState("");
    const fileRef=useRef<HTMLInputElement>(null);

    useEffect(()=>{
        apiRequest<{status:string;user:{username:string}}>("/api/user/me").then(r=>setCurrentUser(r.user)).catch(()=>{});
        apiRequest<{status:string;settings:SettingsData}>("/api/settings").then(r=>{setSettings(r.settings);setWebsiteName(r.settings.websiteName);setBrowserTitle(r.settings.browserTitle);setLogoUrl(r.settings.logoUrl??"");setSupportEmail(r.settings.supportEmail);setNotificationsEnabled(r.settings.notificationsEnabled);syncPublicConfig(r.settings.config);}).catch(e=>setMessage(e instanceof Error?e.message:"Unable to load settings."));
    },[]);

    const config=settings?.config;
    const updateConfig=(patch:Partial<SiteConfig>)=>setSettings(prev=>prev?({...prev,config:{...prev.config,...patch}}):prev);
    const toggle=(key:SectionKey)=>setOpen(prev=>({...prev,[key]:!prev[key]}));
    const updateStatus=(key:SectionKey,text:string)=>setStatus(prev=>({...prev,[key]:text}));

    const updateHero=(index:number,patch:Partial<HeroSlide>)=>{if(!config)return;const items=[...config.heroSlides];items[index]={...items[index],...patch};updateConfig({heroSlides:items});};
    const moveHero=(index:number,direction:-1|1)=>{if(!config)return;const next=index+direction;if(next<0||next>=config.heroSlides.length)return;const items=[...config.heroSlides];[items[index],items[next]]=[items[next],items[index]];updateConfig({heroSlides:items.map((x,i)=>({...x,order:i+1}))});};
    const removeHero=(index:number)=>{if(!config)return;updateConfig({heroSlides:config.heroSlides.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};
    const updateHeader=(index:number,patch:Partial<NavLink>)=>{if(!config)return;const items=[...config.headerLinks];items[index]={...items[index],...patch};updateConfig({headerLinks:items});};
    const removeHeader=(index:number)=>{if(!config)return;updateConfig({headerLinks:config.headerLinks.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};
    const updateFooter=(sectionIndex:number,patch:Partial<FooterSection>)=>{if(!config)return;const sections=[...config.footerSections];sections[sectionIndex]={...sections[sectionIndex],...patch};updateConfig({footerSections:sections});};
    const updateFooterLink=(sectionIndex:number,linkIndex:number,patch:Partial<NavLink>)=>{if(!config)return;const sections=[...config.footerSections];const links=[...sections[sectionIndex].links];links[linkIndex]={...links[linkIndex],...patch};sections[sectionIndex]={...sections[sectionIndex],links};updateConfig({footerSections:sections});};
    const removeFooterLink=(sectionIndex:number,linkIndex:number)=>{if(!config)return;const sections=[...config.footerSections];sections[sectionIndex]={...sections[sectionIndex],links:sections[sectionIndex].links.filter((_,i)=>i!==linkIndex).map((x,i)=>({...x,order:i+1}))};updateConfig({footerSections:sections});};
    const addFooterSection=()=>{if(!config)return;updateConfig({footerSections:[...config.footerSections,{id:`footer-${Date.now()}`,title:emptyText(),active:true,order:config.footerSections.length+1,links:[]}]});};
    const removeFooterSection=(index:number)=>{if(!config)return;updateConfig({footerSections:config.footerSections.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};
    const updateSocial=(index:number,patch:Partial<SocialLink>)=>{if(!config)return;const items=[...config.socialLinks];items[index]={...items[index],...patch};updateConfig({socialLinks:items});};
    const removeSocial=(index:number)=>{if(!config)return;updateConfig({socialLinks:config.socialLinks.filter((_,i)=>i!==index).map((x,i)=>({...x,order:i+1}))});};
    const updatePage=(index:number,patch:Partial<PageConfig>)=>{if(!config)return;const items=[...config.pages];items[index]={...items[index],...patch};updateConfig({pages:items});};
    const removePage=(index:number)=>{if(!config)return;updateConfig({pages:config.pages.filter((_,i)=>i!==index)});};

    const chooseLogo=(e:React.ChangeEvent<HTMLInputElement>)=>{
        const file=e.target.files?.[0];
        if(!file)return;
        if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setMessage("Logo must be PNG, JPEG or WebP.");return;}
        if(file.size>5*1024*1024){setMessage("Logo must be 5 MB or smaller.");return;}
        if(logoPreview)URL.revokeObjectURL(logoPreview);
        setPendingLogo(file);
        setLogoPreview(URL.createObjectURL(file));
        setMessage("Logo preview ready. Accept it, then select Update Branding to save it.");
        if(fileRef.current)fileRef.current.value="";
    };
    const cancelLogo=()=>{if(logoPreview)URL.revokeObjectURL(logoPreview);setPendingLogo(null);setLogoPreview("");};
    const acceptLogo=()=>{if(!pendingLogo)return;setMessage("New logo accepted for this update.");};
    const removeLogo=()=>{if(!logoUrl&&!pendingLogo)return;if(!window.confirm("Remove the current logo? This will be saved when you update Branding."))return;cancelLogo();setLogoUrl("");setMessage("Logo marked for removal. Update Branding to apply it.");};

    const saveSection=async(key:SectionKey)=>{
        if(!settings||!config)return;
        try{
            setSaving(key);setMessage("");updateStatus(key,"");
            let finalLogo=logoUrl||null;
            if(key==="branding"&&pendingLogo){
                const fd=new FormData();fd.append("image",pendingLogo);
                const uploaded=await apiRequest<{image_url:string}>("/api/upload/logo",{method:"POST",body:fd});
                finalLogo=uploaded.image_url;setLogoUrl(uploaded.image_url);cancelLogo();
            }
            const configPatch:Partial<SiteConfig>=key==="branding"?{businessPhone:config.businessPhone,businessAddress:config.businessAddress,slogan:config.slogan}:key==="hero"?{heroSlides:config.heroSlides}:key==="header"?{headerLinks:config.headerLinks,pages:config.pages}:key==="footer"?{footerSections:config.footerSections}:key==="social"?{socialLinks:config.socialLinks}:{designerName:config.designerName,designerTitle:config.designerTitle,designerBio:config.designerBio};
            const r=await apiRequest<{status:string;settings:SettingsData}>("/api/settings",{method:"PUT",body:JSON.stringify({websiteName,browserTitle,logoUrl:finalLogo,supportEmail,notificationsEnabled,config:configPatch})});
            const verify=await apiRequest<{status:string;settings:SettingsData}>("/api/settings");
            setSettings(verify.settings);setWebsiteName(verify.settings.websiteName);setBrowserTitle(verify.settings.browserTitle);setLogoUrl(verify.settings.logoUrl??"");setSupportEmail(verify.settings.supportEmail);setNotificationsEnabled(verify.settings.notificationsEnabled);syncPublicConfig(verify.settings.config);
            updateStatus(key,"✓ Cambios guardados");
            setMessage(r.status==="success"?"Cambios guardados y verificados en el servidor.":"Cambios actualizados.");
        }catch(err){updateStatus(key,"No se pudo guardar");setMessage(err instanceof Error?err.message:"Unable to save settings.");}
        finally{setSaving(null);}
    };

    if(!settings||!config)return <><AdminSidebar username={currentUser?.username||"Administrator"}/><main className="admin-settings"><div className="admin-settings__loading">Loading Settings…</div></main></>;

    const Section=({id,icon,title,kicker,children,add}:{id:SectionKey;icon:React.ReactNode;title:string;kicker:string;children:React.ReactNode;add?:React.ReactNode})=><section className={`admin-settings__section ${open[id]?"is-open":""}`}><button className="admin-settings__section-head" onClick={()=>toggle(id)} type="button"><span className="admin-settings__section-icon">{icon}</span><span className="admin-settings__section-title"><small>{kicker}</small><strong>{title}</strong></span>{add&&<span className="admin-settings__head-add" onClick={e=>e.stopPropagation()}>{add}</span>}<span className="admin-settings__chevron">{open[id]?<Collapse size={20}/>:<Expand size={20}/>}</span></button>{open[id]&&<div className="admin-settings__section-body">{children}<div className="admin-settings__section-actions"><span className={status[id]?.startsWith("✓")?"success":"section-status"}>{status[id]}</span><button className="admin-settings__update" onClick={()=>saveSection(id)} disabled={saving!==null}><Save size={17}/>{saving===id?"Actualizando…":"Actualizar"}</button></div></div>}</section>;

    return <div className="admin-layout"><AdminSidebar username={currentUser?.username||"Administrator"}/><main className="admin-settings">
        <section className="admin-settings__hero"><div><span>ADMINISTRATION</span><h1>Settings</h1><p>Manage the public website section by section. Each update is saved and verified independently.</p></div><Settings size={42}/></section>
        <section className="admin-settings__container">{message&&<div className="admin-settings__message">{message}<button onClick={()=>setMessage("")}><X size={16}/></button></div>}

            <Section id="branding" icon={<Building2/>} kicker="BRANDING" title="Business & Website">
                <div className="admin-settings__grid"><label>Store Name<input value={websiteName} onChange={e=>setWebsiteName(e.target.value)}/></label><label>Browser Title<input value={browserTitle} onChange={e=>setBrowserTitle(e.target.value)}/></label><label>Support Email<input type="email" value={supportEmail} onChange={e=>setSupportEmail(e.target.value)}/></label><label>Business Phone<input value={config.businessPhone} onChange={e=>updateConfig({businessPhone:e.target.value})}/></label><label>Business Address<input value={config.businessAddress} onChange={e=>updateConfig({businessAddress:e.target.value})}/></label><label>Slogan (English)<input value={config.slogan.en} onChange={e=>updateConfig({slogan:{en:e.target.value,es:config.slogan.es}})}/></label></div>
                <div className="admin-settings__logo-card"><div><strong>Website Logo</strong><p>PNG, JPEG or WebP · max 5 MB</p></div><div className="admin-settings__logo-row">{(logoPreview||logoUrl)&&<img src={logoPreview||logoUrl} alt="Logo preview"/>}<input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={chooseLogo}/><button type="button" onClick={()=>fileRef.current?.click()}><Upload size={17}/> Seleccionar</button>{pendingLogo&&<><button className="secondary" type="button" onClick={acceptLogo}><Check size={17}/> Aceptar</button><button className="secondary" type="button" onClick={cancelLogo}>Cancelar</button></>}{logoUrl&&!pendingLogo&&<button className="danger" type="button" onClick={removeLogo}><Trash2 size={17}/> Eliminar</button>}</div></div>
                <label className="admin-settings__toggle"><input type="checkbox" checked={notificationsEnabled} onChange={e=>setNotificationsEnabled(e.target.checked)}/> Administrative notifications enabled</label>
            </Section>

            <Section id="hero" icon={<LayoutTemplate/>} kicker="HOME" title="Hero Slider" add={<button className="admin-settings__add" onClick={()=>updateConfig({heroSlides:[...config.heroSlides,emptyHero(config.heroSlides.length+1)]})}><Plus size={17}/> Add Slider</button>}>
                <div className="admin-settings__list">{config.heroSlides.map((slide,i)=><article className="admin-settings__item" key={slide.id}><div className="admin-settings__item-top"><strong>Slider {i+1}</strong><div><button onClick={()=>moveHero(i,-1)} disabled={i===0}><ChevronUp/></button><button onClick={()=>moveHero(i,1)} disabled={i===config.heroSlides.length-1}><ChevronDown/></button><button className="danger" onClick={()=>removeHero(i)}><Trash2/></button></div></div><div className="admin-settings__grid"><label>Image URL<input value={slide.image} onChange={e=>updateHero(i,{image:e.target.value})}/></label><label>Background URL<input value={slide.background} onChange={e=>updateHero(i,{background:e.target.value})}/></label><label>Title (English)<textarea value={slide.title.en} onChange={e=>updateHero(i,{title:{...slide.title,en:e.target.value}})}/></label><label>Subtitle (English)<textarea value={slide.subtitle.en} onChange={e=>updateHero(i,{subtitle:{...slide.subtitle,en:e.target.value}})}/></label><label>Primary Button<input value={slide.primaryButton.en} onChange={e=>updateHero(i,{primaryButton:{...slide.primaryButton,en:e.target.value}})}/></label><label>Primary Link<input value={slide.primaryLink} onChange={e=>updateHero(i,{primaryLink:e.target.value})}/></label><label>Secondary Button<input value={slide.secondaryButton.en} onChange={e=>updateHero(i,{secondaryButton:{...slide.secondaryButton,en:e.target.value}})}/></label><label>Secondary Link<input value={slide.secondaryLink} onChange={e=>updateHero(i,{secondaryLink:e.target.value})}/></label><label className="admin-settings__toggle"><input type="checkbox" checked={slide.active} onChange={e=>updateHero(i,{active:e.target.checked})}/> Active</label></div></article>)}</div>
            </Section>

            <Section id="header" icon={<Link2/>} kicker="HEADER" title="Navigation & Pages" add={<button className="admin-settings__add" onClick={()=>updateConfig({headerLinks:[...config.headerLinks,emptyLink(config.headerLinks.length+1)]})}><Plus size={17}/> Add Navigation</button>}>
                <div className="admin-settings__list">{config.headerLinks.map((link,i)=><article className="admin-settings__compact" key={link.id}><input value={link.label.en} placeholder="Page name" onChange={e=>updateHeader(i,{label:{...link.label,en:e.target.value}})}/><input value={link.path} placeholder="/path" onChange={e=>updateHeader(i,{path:e.target.value})}/><label><input type="checkbox" checked={link.active} onChange={e=>updateHeader(i,{active:e.target.checked})}/> Active</label><button className="danger" onClick={()=>removeHeader(i)}><Trash2/></button></article>)}</div>
                <div className="admin-settings__subhead"><div><small>PUBLIC PAGES</small><strong>Page Content</strong></div><button className="admin-settings__add" onClick={()=>updateConfig({pages:[...config.pages,emptyPage()]})}><Plus size={17}/> Add Page</button></div>
                <div className="admin-settings__list">{config.pages.map((page,i)=><article className="admin-settings__item" key={page.id}><div className="admin-settings__item-top"><strong>Page {i+1}</strong><button className="danger" onClick={()=>removePage(i)}><Trash2/></button></div><div className="admin-settings__grid"><label>Title (English)<input value={page.title.en} onChange={e=>updatePage(i,{title:{...page.title,en:e.target.value}})}/></label><label>Slug<input value={page.slug} onChange={e=>updatePage(i,{slug:e.target.value.replace(/^\//,"")})}/></label><label className="full">Body (English)<textarea value={page.body.en} onChange={e=>updatePage(i,{body:{...page.body,en:e.target.value}})}/></label><label className="admin-settings__toggle"><input type="checkbox" checked={page.active} onChange={e=>updatePage(i,{active:e.target.checked})}/> Active</label></div></article>)}</div>
            </Section>

            <Section id="footer" icon={<Globe/>} kicker="FOOTER" title="Footer Sections & Pages" add={<button className="admin-settings__add" onClick={addFooterSection}><Plus size={17}/> Add Section</button>}>
                <div className="admin-settings__list">{config.footerSections.map((section,si)=><article className="admin-settings__item" key={section.id}><div className="admin-settings__item-top"><strong><input value={section.title.en} onChange={e=>updateFooter(si,{title:{...section.title,en:e.target.value}})}/></strong><div><button className="danger" onClick={()=>removeFooterSection(si)}><Trash2/></button></div></div>{section.links.map((link,li)=><div className="admin-settings__compact" key={link.id}><input value={link.label.en} onChange={e=>updateFooterLink(si,li,{label:{...link.label,en:e.target.value}})}/><input value={link.path} onChange={e=>updateFooterLink(si,li,{path:e.target.value})}/><label><input type="checkbox" checked={link.active} onChange={e=>updateFooterLink(si,li,{active:e.target.checked})}/> Active</label><button className="danger" onClick={()=>removeFooterLink(si,li)}><Trash2/></button></div>)}<button className="admin-settings__inline-add" onClick={()=>updateFooter(si,{links:[...section.links,emptyLink(section.links.length+1)]})}><Plus size={16}/> Add Page to Section</button></article>)}</div>
            </Section>

            <Section id="social" icon={<Share2/>} kicker="SOCIAL" title="Social Networks" add={<button className="admin-settings__add" onClick={()=>updateConfig({socialLinks:[...config.socialLinks,{id:`social-${Date.now()}`,name:"New Network",url:"",active:true,order:config.socialLinks.length+1}]})}><Plus size={17}/> Add Network</button>}>
                <div className="admin-settings__list">{config.socialLinks.map((social,i)=><article className="admin-settings__compact" key={social.id}><input value={social.name} onChange={e=>updateSocial(i,{name:e.target.value})}/><input value={social.url} placeholder="https://" onChange={e=>updateSocial(i,{url:e.target.value})}/><label><input type="checkbox" checked={social.active} onChange={e=>updateSocial(i,{active:e.target.checked})}/> Active</label><button className="danger" onClick={()=>removeSocial(i)}><Trash2/></button></article>)}</div>
            </Section>

            <Section id="designer" icon={<UserRound/>} kicker="DESIGNER" title="Public Designer Information"><div className="admin-settings__grid"><label>Name (English)<input value={config.designerName.en} onChange={e=>updateConfig({designerName:{...config.designerName,en:e.target.value}})}/></label><label>Title (English)<input value={config.designerTitle.en} onChange={e=>updateConfig({designerTitle:{...config.designerTitle,en:e.target.value}})}/></label><label className="full">Bio (English)<textarea value={config.designerBio.en} onChange={e=>updateConfig({designerBio:{...config.designerBio,en:e.target.value}})}/></label></div></Section>
        </section>
    </main></div>;
}
export default AdminSettings;
