import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Clock3, DollarSign, LayoutDashboard, RefreshCw, ShieldCheck, ShoppingBag, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import "./AdminDashboardPro.css";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

interface AuthenticatedUser { id:string; username:string; first_name:string; last_name:string; email:string; is_active:boolean; role:"USER"|"ADMIN"; created_at:string; updated_at:string; }
interface AdminDashboardData { users:{total_accounts:number;total_users:number;total_admins:number}; reviews:{total_reviews:number;pending_reviews:number;approved_reviews:number}; sales:{total_sales:number;total_orders:number}; }

function AdminDashboard(){
 const navigate=useNavigate();
 const [dashboard,setDashboard]=useState<AdminDashboardData|null>(null); const [currentUser,setCurrentUser]=useState<AuthenticatedUser|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
 const loadDashboard=useCallback(async()=>{try{setLoading(true);setError(null);const [dashboardResult,userResult]=await Promise.all([apiRequest<{status:string;data:AdminDashboardData}>("/api/admin/dashboard"),apiRequest<{status:string;user:AuthenticatedUser}>("/api/user/me")]);setDashboard(dashboardResult.data);setCurrentUser(userResult.user)}catch(err){console.error("Unable to load administrator dashboard:",err);setError("Unable to load administrator dashboard.")}finally{setLoading(false)}},[]);
 useEffect(()=>{loadDashboard()},[loadDashboard]);
 const totalSales=Number(dashboard?.sales.total_sales||0); const totalOrders=Number(dashboard?.sales.total_orders||0); const totalAccounts=Number(dashboard?.users.total_accounts||0); const pendingReviews=Number(dashboard?.reviews.pending_reviews||0); const approvedReviews=Number(dashboard?.reviews.approved_reviews||0); const totalReviews=Number(dashboard?.reviews.total_reviews||0);
 const quickActions=[{label:"View Orders",description:"Review and fulfill customer orders",icon:ShoppingBag,path:"/admin/orders"},{label:"Open Sales",description:"Monitor current sales performance",icon:DollarSign,path:"/admin/sales"},{label:"Review Feedback",description:"Manage customer reviews",icon:Star,path:"/admin/reviews"},{label:"Manage Users",description:"View accounts and administrators",icon:Users,path:"/admin/users"}];
 return <div className="admin-layout"><AdminSidebar username={currentUser?.username||"Administrator"}/><main className="admin-dashboard">
  <section className="admin-dashboard__hero"><div className="admin-dashboard__hero-content"><div><span className="admin-dashboard__eyebrow">ADMINISTRATION</span><h1>Good to see you, {currentUser?.first_name||"Administrator"}.</h1><p>One clear view of the business, customer activity, orders, and the areas that need your attention.</p></div><div className="admin-dashboard__hero-actions"><button type="button" className="admin-dashboard__refresh" onClick={loadDashboard} disabled={loading}><RefreshCw size={17} className={loading?"admin-dashboard__spin":""}/><span>{loading?"Refreshing":"Refresh"}</span></button><div className="admin-dashboard__hero-icon" aria-hidden="true"><LayoutDashboard size={40}/></div></div></div></section>
  <section className="admin-dashboard__container">
   {error&&<div className="admin-dashboard__message admin-dashboard__message--error" role="alert"><div><strong>Dashboard unavailable</strong><span>{error}</span></div><button type="button" onClick={loadDashboard}>Try again</button></div>}
   {loading&&!dashboard&&!error&&<div className="admin-dashboard__loading-grid" aria-label="Loading dashboard">{[1,2,3,4].map(item=><div className="admin-dashboard__skeleton" key={item}/>)}</div>}
   {dashboard&&<>
    <section className="admin-dashboard__overview"><div className="admin-dashboard__section-heading"><div><span>AT A GLANCE</span><h2>Business overview</h2></div><span className="admin-dashboard__updated"><Clock3 size={14}/> Live account data</span></div><div className="admin-dashboard__metric-grid">
     <article className="admin-dashboard__metric admin-dashboard__metric--primary"><div className="admin-dashboard__metric-top"><span>Sales</span><DollarSign size={19}/></div><strong>${totalSales.toFixed(2)}</strong><small>Total recorded sales</small></article>
     <article className="admin-dashboard__metric"><div className="admin-dashboard__metric-top"><span>Orders</span><ShoppingBag size={19}/></div><strong>{totalOrders}</strong><small>Total orders recorded</small></article>
     <article className="admin-dashboard__metric"><div className="admin-dashboard__metric-top"><span>Accounts</span><Users size={19}/></div><strong>{totalAccounts}</strong><small>Registered accounts</small></article>
     <article className={`admin-dashboard__metric ${pendingReviews>0?"admin-dashboard__metric--attention":""}`}><div className="admin-dashboard__metric-top"><span>Reviews to check</span><Star size={19}/></div><strong>{pendingReviews}</strong><small>{pendingReviews>0?"Waiting for moderation":"Nothing waiting"}</small></article>
    </div></section>
    <section className="admin-dashboard__workspace"><div className="admin-dashboard__section-heading"><div><span>OPERATIONS</span><h2>Quick actions</h2></div></div><div className="admin-dashboard__actions-grid">{quickActions.map(({label,description,icon:Icon,path})=><button type="button" className="admin-dashboard__action" key={path} onClick={()=>navigate(path)}><span className="admin-dashboard__action-icon"><Icon size={21}/></span><span className="admin-dashboard__action-copy"><strong>{label}</strong><small>{description}</small></span><ArrowRight size={17}/></button>)}</div></section>
    <section className="admin-dashboard__detail-grid">
     <article className="admin-dashboard__panel"><div className="admin-dashboard__panel-heading"><div><span>TEAM</span><h2>Users & access</h2></div><Users size={20}/></div><div className="admin-dashboard__breakdown"><div><span>Total accounts</span><strong>{totalAccounts}</strong></div><div><span>Normal users</span><strong>{dashboard.users.total_users}</strong></div><div><span>Administrators</span><strong>{dashboard.users.total_admins}</strong></div></div><button type="button" className="admin-dashboard__panel-link" onClick={()=>navigate("/admin/users")}>Manage users <ArrowRight size={15}/></button></article>
     <article className="admin-dashboard__panel"><div className="admin-dashboard__panel-heading"><div><span>CUSTOMER VOICE</span><h2>Review health</h2></div><Star size={20}/></div><div className="admin-dashboard__review-main"><strong>{pendingReviews}</strong><span>Pending reviews</span></div><div className="admin-dashboard__review-progress"><span style={{width:`${totalReviews?Math.min(100,(approvedReviews/totalReviews)*100):0}%`}}/></div><div className="admin-dashboard__review-meta"><span>{approvedReviews} approved</span><span>{totalReviews} total</span></div><button type="button" className="admin-dashboard__panel-link" onClick={()=>navigate("/admin/reviews")}>Open reviews <ArrowRight size={15}/></button></article>
    </section>
    <section className="admin-dashboard__status-banner"><div className="admin-dashboard__status-icon"><ShieldCheck size={20}/></div><div><strong>Administration center</strong><span>Core dashboard data is connected to the live admin APIs. Use the dedicated modules for detailed sales, orders, reviews, users, and reporting workflows.</span></div></section>
   </>}
  </section>
 </main></div>;
}
export default AdminDashboard;
