import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Clock3, Image, Mail, Megaphone, MessageCircle, MousePointer2, Play, Search, Sparkles, TrendingUp, Users, Video, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "../../services/api";
import AdminSidebar from "./AdminSidebar";

interface SalesDay { date: string; orders: number; revenue: string | number; }
interface SalesResponse { daily?: SalesDay[]; }
type Channel = { name: string; detail: string; icon: LucideIcon; tone: string };

const channels: Channel[] = [
    { name: "Google", detail: "Search & Shopping", icon: Search, tone: "#4285F4" },
    { name: "Facebook", detail: "Pages & Ads", icon: MessageCircle, tone: "#1877F2" },
    { name: "Instagram", detail: "Posts & Reels", icon: Image, tone: "#E1306C" },
    { name: "TikTok", detail: "Short-form video", icon: Video, tone: "#e5e7eb" },
    { name: "YouTube", detail: "Video campaigns", icon: Play, tone: "#FF0000" },
    { name: "Pinterest", detail: "Pins & products", icon: Image, tone: "#BD081C" },
    { name: "WhatsApp", detail: "Customer campaigns", icon: MessageCircle, tone: "#25D366" },
    { name: "Email", detail: "Newsletters & offers", icon: Mail, tone: "#4F83CC" },
];

const actions: Array<{ title: string; detail: string; icon: LucideIcon }> = [
    { title: "SEO Optimization", detail: "Improve search visibility", icon: Search },
    { title: "Promote a Product", detail: "Create a multi-channel campaign", icon: Megaphone },
    { title: "Generate Content", detail: "Captions, hashtags & ideas", icon: Sparkles },
    { title: "Run Ads", detail: "Google, Meta, TikTok & more", icon: Play },
    { title: "WhatsApp Campaign", detail: "Send a promotion", icon: MessageCircle },
    { title: "Email Campaign", detail: "Newsletters & offers", icon: Mail },
];

function AdminMarketing() {
    const [range, setRange] = useState<"7" | "30" | "90">("30");
    const [sales, setSales] = useState<SalesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [drafts, setDrafts] = useState<string[]>([]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - Number(range) + 1);
            const iso = (d: Date) => d.toISOString().slice(0, 10);
            setSales(await apiRequest<SalesResponse>(`/api/admin/sales?start=${iso(start)}&end=${iso(end)}`));
        } catch (err) {
            console.error("Marketing Center load error:", err);
            setError("Marketing analytics are temporarily unavailable.");
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { void load(); }, [load]);

    const metrics = useMemo(() => {
        const daily = sales?.daily ?? [];
        return {
            orders: daily.reduce((sum, item) => sum + Number(item.orders || 0), 0),
            revenue: daily.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
        };
    }, [sales]);

    const chart = useMemo(() => {
        const daily = sales?.daily ?? [];
        if (!daily.length) return "0,100 100,100 200,100 300,100";
        const max = Math.max(...daily.map(item => Number(item.revenue || 0)), 1);
        return daily.map((item, index) => {
            const x = daily.length === 1 ? 150 : (index / (daily.length - 1)) * 300;
            const y = 100 - (Number(item.revenue || 0) / max) * 82;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
    }, [sales]);

    const createDraft = (name: string) => {
        setDrafts(current => [`${name} · Draft`, ...current]);
        setModal("draft");
    };

    const createAiDraft = () => {
        const value = prompt.trim();
        if (!value) return;
        createDraft(`AI campaign · ${value.slice(0, 44)}${value.length > 44 ? "…" : ""}`);
        setPrompt("");
    };

    return <div className="marketing-page">
        <style>{`
            .marketing-page{min-height:100vh;background:#07101d;color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.marketing-main{margin-left:270px;padding:24px 26px 42px;max-width:1600px}.marketing-hero{position:relative;overflow:hidden;border:1px solid #293a54;border-radius:18px;padding:27px 32px;background:radial-gradient(circle at 84% 34%,rgba(103,64,190,.48),transparent 34%),linear-gradient(115deg,#25105d,#0b1729 58%,#10243b);box-shadow:0 18px 50px rgba(0,0,0,.22)}.marketing-hero:after{content:"JQYD";position:absolute;right:35px;bottom:-45px;font-size:150px;font-weight:900;letter-spacing:-10px;color:rgba(255,255,255,.045)}.eyebrow{font-size:12px;letter-spacing:.08em;color:#e3b8ff;font-weight:800}.marketing-hero h1{font-size:40px;line-height:1.05;margin:8px 0 10px;max-width:760px}.marketing-hero h1 span{color:#c46cff}.marketing-hero p{margin:0;color:#d6deea;max-width:760px}.sub{margin-top:7px;font-size:15px}.actions{display:flex;gap:10px;margin-top:18px}.btn{border:1px solid #50617d;border-radius:10px;background:#111f33;color:#fff;padding:10px 16px;font-weight:700;display:inline-flex;align-items:center;gap:8px;cursor:pointer}.btn.primary{border-color:#8a42ff;background:linear-gradient(135deg,#7d24ff,#24a8ef)}.stats{display:grid;grid-template-columns:repeat(4,1fr) 190px;gap:10px;margin:12px 0}.stat,.card{background:#0d1929;border:1px solid #26364e;border-radius:13px}.stat{padding:15px}.stat-top{display:flex;justify-content:space-between;color:#9eacc0;font-size:12px}.stat strong{display:block;font-size:25px;margin-top:6px}.stat small{color:#54e889;font-weight:700}.range{display:flex;align-items:center;justify-content:center;gap:7px}.select{background:#0d1929;border:1px solid #41536d;color:#fff;border-radius:9px;padding:9px}.section{margin-top:13px}.section-title{padding:0 2px 10px}.section-title h2{font-size:18px;margin:0}.section-title p{font-size:12px;color:#9eacc0;margin:4px 0}.channels{display:grid;grid-template-columns:repeat(8,1fr);gap:9px}.channel{padding:13px 8px;text-align:center;cursor:pointer}.channel-icon{width:40px;height:40px;border-radius:12px;margin:auto;display:grid;place-items:center;background:#14243a}.channel strong{display:block;font-size:12px;margin-top:8px}.channel small{color:#8292a8;font-size:10px}.status{display:inline-flex;align-items:center;gap:4px;margin-top:7px;border-radius:999px;padding:4px 8px;background:#1b2a3e;color:#b9c6d6;font-size:10px}.quick{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.quick-card{padding:14px;display:flex;gap:9px;align-items:center;text-align:left;cursor:pointer}.quick-icon{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#162c59;color:#54b9ff;flex:none}.quick-card strong{font-size:12px}.quick-card small{display:block;color:#8391a5;font-size:10px;margin-top:3px}.bottom{display:grid;grid-template-columns:1.25fr .95fr .9fr;gap:12px}.panel{padding:15px}.head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.head h3{margin:0;font-size:16px}.head span{font-size:10px;color:#8e9db1}.chart{height:190px;border:1px solid #1e2c40;border-radius:10px;overflow:hidden}.chart svg{width:100%;height:100%}.legend{display:flex;gap:14px;margin-top:9px;flex-wrap:wrap;font-size:10px;color:#a6b3c4}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.campaigns{display:grid;gap:7px}.campaign{display:flex;justify-content:space-between;gap:8px;padding:9px;border:1px solid #1f2d42;border-radius:9px}.campaign strong{font-size:11px}.campaign small{display:block;color:#7f8ea3;font-size:9px;margin-top:3px}.pill{font-size:9px;padding:4px 8px;border-radius:999px;background:#2b2451;color:#d6b9ff;white-space:nowrap}.assistant{background:radial-gradient(circle at 90% 10%,rgba(114,67,255,.3),transparent 42%),#10172b}.assistant p{font-size:11px;color:#aab5c5;line-height:1.45}.assistant-box{display:flex;gap:8px;background:#28215f;border:1px solid #5946bb;border-radius:10px;padding:7px}.assistant-box textarea{flex:1;min-height:48px;background:transparent;border:0;resize:none;color:#fff;outline:0;font:inherit;font-size:11px}.send{width:42px;border:0;border-radius:8px;background:#6c4cff;color:#fff;cursor:pointer}.prompts{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.prompt{border:1px solid #3b4b65;background:#142035;color:#cbd5e1;border-radius:999px;padding:6px 9px;font-size:9px;cursor:pointer}.empty{padding:20px;text-align:center;color:#7f8da1;font-size:11px}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:100;display:grid;place-items:center;padding:20px}.modal{width:min(540px,100%);background:#0d1929;border:1px solid #344967;border-radius:16px;padding:20px;box-shadow:0 30px 80px #000}.modal-head{display:flex;justify-content:space-between;align-items:center}.modal h2{margin:0;font-size:19px}.close{background:transparent;border:0;color:#aab8ca;cursor:pointer}.modal p{color:#aeb9c8;font-size:13px;line-height:1.55}.modal-item{padding:11px;border:1px solid #24364f;border-radius:9px;color:#dce5ef;font-size:12px;margin:10px 0}.modal-item b{display:block;margin-bottom:3px}.modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}@media(max-width:1200px){.channels{grid-template-columns:repeat(4,1fr)}.quick{grid-template-columns:repeat(3,1fr)}.bottom{grid-template-columns:1fr 1fr}.assistant{grid-column:1/-1}.stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.marketing-main{margin-left:0;padding:15px}.marketing-hero{padding:21px}.marketing-hero h1{font-size:29px}.channels{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:1fr 1fr}.bottom{grid-template-columns:1fr}.range{grid-column:1/-1;justify-content:flex-start}.marketing-hero:after{display:none}}
        `}</style>
        <AdminSidebar username="Administrator" />
        <main className="marketing-main">
            <section className="marketing-hero"><div className="eyebrow">MARKETING CENTER</div><h1>Grow Your Brand <span>Everywhere</span></h1><div className="sub">SEO · Social Media · Ads · Content · Analytics · All in One Place</div><p>Promote your products, reach more customers and grow JQYD with one focused workspace.</p><div className="actions"><button className="btn primary" onClick={() => createDraft("New JQYD campaign")}><Megaphone size={16}/>Create Campaign</button><button className="btn" onClick={() => setModal("tutorial")}><Play size={15}/>Watch Tutorial</button></div></section>
            <section className="stats"><article className="stat"><div className="stat-top"><span>Total Visits</span><MousePointer2 size={18}/></div><strong>—</strong><small>Connect Analytics</small></article><article className="stat"><div className="stat-top"><span>Product Views</span><TrendingUp size={18}/></div><strong>—</strong><small>Connect Analytics</small></article><article className="stat"><div className="stat-top"><span>Orders</span><Users size={18}/></div><strong>{metrics.orders.toLocaleString()}</strong><small>Live order data</small></article><article className="stat"><div className="stat-top"><span>Revenue</span><BarChart3 size={18}/></div><strong>${metrics.revenue.toFixed(2)}</strong><small>Live sales data</small></article><div className="stat range"><Clock3 size={15}/><select className="select" value={range} onChange={e => setRange(e.target.value as "7" | "30" | "90")}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div></section>
            <section className="section"><div className="section-title"><h2>Connect Your Channels</h2><p>Link your accounts to publish, run ads and manage everything from one place.</p></div><div className="channels">{channels.map(({name,detail,icon:Icon,tone}) => <button className="card channel" key={name} onClick={() => setModal(name)}><span className="channel-icon" style={{color:tone}}><Icon size={21}/></span><strong>{name}</strong><small>{detail}</small><span className="status">Connect</span></button>)}</div></section>
            <section className="section"><div className="section-title"><h2>Quick Actions</h2><p>Create and publish content, optimize SEO or prepare a campaign in a few clicks.</p></div><div className="quick">{actions.map(({title,detail,icon:Icon}) => <button className="card quick-card" key={title} onClick={() => createDraft(title)}><span className="quick-icon"><Icon size={19}/></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={14}/></button>)}</div></section>
            <section className="section bottom"><article className="card panel"><div className="head"><div><span>MARKETING PERFORMANCE</span><h3>Revenue performance</h3></div><BarChart3 size={18}/></div><div className="chart">{loading ? <div className="empty">Loading live sales data…</div> : error ? <div className="empty">{error}</div> : <svg viewBox="0 0 300 120" preserveAspectRatio="none"><g stroke="#1e2c40" strokeWidth="1"><line x1="0" y1="18" x2="300" y2="18"/><line x1="0" y1="59" x2="300" y2="59"/><line x1="0" y1="100" x2="300" y2="100"/></g><polyline points={chart} fill="none" stroke="#7c4dff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div><div className="legend"><span><i className="dot"/>Revenue</span><span>Range: {range} days</span></div></article>
                <article className="card panel"><div className="head"><div><span>CAMPAIGNS</span><h3>Campaign workspace</h3></div><Megaphone size={18}/></div><div className="campaigns">{drafts.length ? drafts.slice(0,6).map((draft,index) => <div className="campaign" key={`${draft}-${index}`}><span><strong>{draft}</strong><small>Ready for setup</small></span><span className="pill">Draft</span></div>) : <div className="empty">No campaigns yet. Create your first campaign above.</div>}</div></article>
                <article className="card panel assistant"><div className="head"><div><span>AI MARKETING ASSISTANT</span><h3>What should we promote?</h3></div><Sparkles size={18}/></div><p>Describe your goal and create a campaign draft. Publishing still requires the connected channel setup.</p><div className="assistant-box"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Example: promote our best-selling mug this weekend"/><button className="send" onClick={createAiDraft} aria-label="Create AI campaign draft">→</button></div><div className="prompts">{["Weekend sale","Best seller","New product","Holiday offer"].map(item => <button className="prompt" key={item} onClick={() => setPrompt(item)}>{item}</button>)}</div></article>
            </section>
        </main>
        {modal && <div className="modal-bg" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><h2>{modal === "draft" ? "Campaign draft created" : modal === "tutorial" ? "Marketing Center" : `Connect ${modal}`}</h2><button className="close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button></div>{modal === "draft" ? <><p>The campaign is saved as a local draft in this workspace. Connect the desired channel before publishing.</p><div className="modal-item"><b>{drafts[0] ?? "New campaign"}</b>Draft ready for configuration.</div></> : modal === "tutorial" ? <p>This workspace centralizes SEO, channel connections, campaign preparation and sales performance. External publishing requires the corresponding platform connection.</p> : <p>{modal} connection is ready to be configured. No external account has been authorized from this page yet.</p>}<div className="modal-footer"><button className="btn" onClick={() => setModal(null)}>Close</button></div></div></div>}
    </div>;
}

export default AdminMarketing;
