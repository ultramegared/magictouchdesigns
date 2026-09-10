import type { FooterContent } from "./Footer.types";

const fallback: FooterContent = {
    shop:{title:"SHOP",links:[{label:"All Models",href:"/products"},{label:"Collections",href:"/collections"},{label:"Customize",href:"/customize"}]},
    company:{title:"COMPANY",links:[{label:"About Us",href:"/about"},{label:"How It Works",href:"/how-it-works"},{label:"Shipping & Returns",href:"/shipping-returns"},{label:"FAQs",href:"/faqs"}]},
    support:{title:"SUPPORT",links:[{label:"Contact Us",href:"/contact"},{label:"Track My Order",href:"/track-order"},{label:"Privacy Policy",href:"/privacy"},{label:"Terms of Service",href:"/terms-of-service"}]},
    social:[{name:"Instagram",href:"#"},{name:"Facebook",href:"#"},{name:"TikTok",href:"#"},{name:"YouTube",href:"#"}],
    phone:"+1 (346) 760-3007",copyright:"© 2026 Magic Touch Designs. All rights reserved.",designer:"Designed by J.Q - webmaster",
};

const read = (): any => { try { const raw=localStorage.getItem("mtd_site_config"); const c=raw?JSON.parse(raw):null; if(!c)return fallback; const sections=(c.footerSections||[]).filter((x:any)=>x.active).sort((a:any,b:any)=>a.order-b.order).map((x:any)=>({title:x.title?.en||x.title||"",links:(x.links||[]).filter((l:any)=>l.active).sort((a:any,b:any)=>a.order-b.order).map((l:any)=>({label:l.label?.en||l.label||"",href:l.path}))})); return {shop:sections[0]||fallback.shop,company:sections[1]||fallback.company,support:sections[2]||fallback.support,social:(c.socialLinks||[]).filter((x:any)=>x.active).sort((a:any,b:any)=>a.order-b.order).map((x:any)=>({name:x.name,href:x.url})),phone:c.businessPhone||fallback.phone,copyright:fallback.copyright,designer:fallback.designer}; } catch{return fallback;} };

export const footerContent: FooterContent = new Proxy(fallback as any,{get(_target,property){return read()[property];}}) as FooterContent;
