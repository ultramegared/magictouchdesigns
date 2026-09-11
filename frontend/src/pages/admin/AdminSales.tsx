import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BarChart3, Clock3, CreditCard, Package, RefreshCw, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminSales.css";

type Item = { product_id?: string | null; product_name: string; quantity: number; unit_price: number };
type Order = { id:string; order_code:string; customer_first_name?:string; customer_last_name?:string; customer_email?:string; subtotal:number; total:number; currency:string; payment_provider?:string|null; payment_status:string; status:string; created_at:string; items:Item[] };
type SalesData = { start:string; end:string; orders:Order[]; daily:{date:string;orders:number;revenue:number}[]; products:{product_id:string;product_name:string;units:number;revenue:number}[]; payments:{provider:string;orders:number;revenue:number}[] };
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));
const label=(s:string)=>String(s||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const dateOnly=(d:Date)=>d.toISOString().slice(0,10);
const shiftDays=(date:string,days:number)=>{const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return dateOnly(d)};

function AdminSales(){
 const navigate=useNavigate();
 const [data,setData]=useState<SalesData|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
 const [range,setRange]=useState(30); const [from,setFrom]=useState(()=>shiftDays(dateOnly(new Date()),-29)); const [to,setTo]=useState(()=>dateOnly(new Date()));
 const load=useCallback(async()=>{try{setLoading(true);setError(null);const result=await apiRequest<SalesData>(`/api/admin/sales?start=${encodeURIComponent(from)}&end=${encodeURIComponent(to)}`);setData(result)}catch(e){setError(e instanceof Error?e.message:"Unable to load sales.")}finally{setLoading(false)}},[from,to]);
 useEffect(()=>{load()},[load]);
 const paid=useMemo(()=>data?.orders.filter(o=>o.payment_status==="paid")||[],[data]);
 const revenue=paid.reduce((s,o)=>s+Number(o.subtotal||0),0); const aov=paid.length?revenue/paid.length:0; const units=paid.reduce((s,o)=>s+(o.items||[]).reduce((n,i)=>n+Number(i.quantity||0),0),0);
 const buyers=new Set(paid.map(o=>String(o.customer_email||"").toLowerCase()).filter(Boolean));
 const active=(data?.orders||[]).filter(o=>!["cancelled","refunded","delivered"].includes(o.status));
 const maxDaily=Math.max(1,...(data?.daily||[]).map(d=>Number(d.revenue||0)));
 const recent=[...(data?.orders||[])].slice(0,8);
 const applyPreset=(days:number)=>{const end=new Date();setRange(days);setTo(dateOnly(end));setFrom(shiftDays(dateOnly(end),-(days-1)))};
 return <div className="admin-page"><AdminSidebar/><main className="admin-sales">
  <header className="admin-sales__header"><div><div className="admin-sales__eyebrow"><TrendingUp size={16}/> SALES</div><h1>Sales Performance</h1><p>Operational sales intelligence — what is selling, what needs attention, and where customers are buying.</p></div><button className="sales-refresh" onClick={load} disabled={loading}><RefreshCw size={16} className={loading?"spin":""}/> Refresh</button></header>
  <div className="admin-sales__toolbar"><div className="admin-sales__presets">{[[1,"Today"],[7,"7 days"],[30,"30 days"],[90,"90 days"]].map(([n,t])=><button key={n} className={range===n?"active":""} onClick={()=>applyPreset(Number(n))}>{t}</button>)}</div><label>From<input type="date" value={from} onChange={e=>{setRange(0);setFrom(e.target.value)}}/></label><label>To<input type="date" value={to} onChange={e=>{setRange(0);setTo(e.target.value)}}/></label></div>
  {error&&<div className="admin-sales__alert">{error}</div>}
  {loading&&!data?<div className="admin-sales__loading">Loading sales performance…</div>:<>
   <section className="admin-sales__kpis"><article><span>$</span><small>Product Revenue</small><strong>{money(revenue)}</strong><em>Paid orders only</em></article><article><span><ShoppingCart size={18}/></span><small>Paid Orders</small><strong>{paid.length}</strong><em>{data?.orders.length||0} orders in period</em></article><article><span><BarChart3 size={18}/></span><small>Average Order Value</small><strong>{money(aov)}</strong><em>Product subtotal / paid order</em></article><article><span><Package size={18}/></span><small>Units Sold</small><strong>{units}</strong><em>Across paid orders</em></article></section>
   <section className="admin-sales__grid admin-sales__grid--wide"><article className="admin-sales__card"><div className="card-title"><div><span>SALES PULSE</span><h2>Revenue by day</h2></div><b>{money(revenue)}</b></div><div className="sales-bars">{(data?.daily||[]).map(d=><div className="sales-bar" key={d.date} title={`${d.date}: ${money(Number(d.revenue))}`}><i style={{height:`${Math.max(4,(Number(d.revenue)/maxDaily)*100)}%`}}/><small>{d.date.slice(5)}</small></div>)}</div><p className="note">Only paid order product revenue is shown here. Reports remains the source for formal historical reporting.</p></article>
   <article className="admin-sales__card"><div className="card-title"><div><span>ORDER FLOW</span><h2>What needs attention</h2></div><Activity size={20}/></div><div className="flow-grid">{["pending_payment","paid","processing","shipped","delivered"].map(s=><div key={s}><strong>{data?.orders.filter(o=>o.status===s).length||0}</strong><span>{label(s)}</span></div>)}</div><div className="attention"><Clock3 size={16}/><b>{active.length}</b> active orders<button onClick={()=>navigate("/admin/orders")}>Open Orders <ArrowRight size={14}/></button></div></article></section>
   <section className="admin-sales__grid"><article className="admin-sales__card"><div className="card-title"><div><span>PRODUCT PERFORMANCE</span><h2>What is selling</h2></div><Package size={20}/></div>{(data?.products||[]).slice(0,6).map((p,i)=><div className="product-row" key={`${p.product_id}-${p.product_name}`}><div className="product-rank">{i+1}</div><div className="product-info"><b>{p.product_name}</b><span>{p.units} units</span></div><strong>{money(Number(p.revenue))}</strong></div>)}{!data?.products.length&&<p className="empty">No paid product sales in this period.</p>}</article>
   <article className="admin-sales__card"><div className="card-title"><div><span>BUYING BEHAVIOR</span><h2>Customer activity</h2></div><Users size={20}/></div><div className="customer-metrics"><div><strong>{buyers.size}</strong><span>Unique buyers</span></div><div><strong>{paid.length}</strong><span>Paid purchases</span></div><div><strong>{buyers.size?((paid.length/buyers.size).toFixed(1)):"0.0"}</strong><span>Purchases / buyer</span></div></div><p className="note">Based on customer emails recorded on paid orders. No unsupported conversion rate is inferred.</p></article></section>
   <section className="admin-sales__card"><div className="card-title"><div><span>PAYMENT MIX</span><h2>Where customers are paying</h2></div><CreditCard size={20}/></div><div className="payment-grid">{(data?.payments||[]).map(p=><div key={p.provider}><div><b>{label(p.provider)}</b><strong>{money(Number(p.revenue))}</strong></div><small>{p.orders} paid order{p.orders===1?"":"s"}</small></div>)}{!data?.payments.length&&<p className="empty">No paid sales in this period.</p>}</div></section>
   <section className="admin-sales__card recent"><div className="card-title"><div><span>LIVE SALES ACTIVITY</span><h2>Recent sales</h2></div><button onClick={()=>navigate("/admin/orders")}>View all orders <ArrowRight size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>{recent.map(o=><tr key={o.id}><td><b>{o.order_code}</b></td><td><b>{`${o.customer_first_name||""} ${o.customer_last_name||""}`.trim()||"Customer"}</b><small>{o.customer_email||""}</small></td><td>{(o.items||[]).reduce((n,i)=>n+Number(i.quantity||0),0)}</td><td><b>{money(Number(o.total))}</b></td><td>{label(o.payment_provider||"—")}</td><td><span className={`status status--${o.status}`}>{label(o.status)}</span></td><td>{new Date(o.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td></tr>)}</tbody></table></div></section>
  </>}
 </main></div>;
}
export default AdminSales;
