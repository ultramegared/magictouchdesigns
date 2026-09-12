import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, LogOut, Package, RefreshCw, ShieldCheck, Star, UserRound } from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { apiRequest } from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";
import "./Account.css";

type AuthenticatedUser={id:string;username:string;first_name:string;last_name:string;email:string;role:string;is_active:boolean;created_at:string;updated_at:string};
type Order={id:string;order_code:string;total:number;currency:string;status:string;payment_status:string;created_at:string;items:Array<{id:string;product_name:string;image_url:string|null;quantity:number}>};
const money=(value:number,currency="USD")=>new Intl.NumberFormat("en-US",{style:"currency",currency}).format(Number(value||0));
const statusLabel=(value:string,isEs:boolean)=>{const map:Record<string,[string,string]>={pending_payment:["Pending payment","Pago pendiente"],processing:["Processing","Procesando"],paid:["Paid","Pagado"],shipped:["Shipped","Enviado"],delivered:["Delivered","Entregado"],cancelled:["Cancelled","Cancelado"],refunded:["Refunded","Reembolsado"],payment_setup_failed:["Payment issue","Problema de pago"]};return map[value]?.[isEs?1:0]||String(value||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())};

function Account(){
 const navigate=useNavigate();
 const {language}=useLanguage();
 const isEs=language==="es";
 const [user,setUser]=useState<AuthenticatedUser|null>(null);
 const [orders,setOrders]=useState<Order[]>([]);
 const [loading,setLoading]=useState(true);
 const [ordersLoading,setOrdersLoading]=useState(true);

 useEffect(()=>{
  const token=localStorage.getItem("auth_token")||sessionStorage.getItem("auth_token");
  if(!token){navigate("/login");return;}
  const load=async()=>{
   try{
    const [userResult,orderResult]=await Promise.all([
     apiRequest<{status:string;user:AuthenticatedUser}>("/api/user/me",{headers:{Authorization:`Bearer ${token}`}}),
     apiRequest<{status:string;orders:Order[]}>("/api/user/orders",{headers:{Authorization:`Bearer ${token}`}})
    ]);
    setUser(userResult.user);
    localStorage.setItem("auth_user",JSON.stringify(userResult.user));
    setOrders(Array.isArray(orderResult.orders)?orderResult.orders:[]);
   }catch(error){
    console.error("Unable to load account dashboard:",error);
    localStorage.removeItem("auth_token");localStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_token");sessionStorage.removeItem("auth_user");
    navigate("/login");
   }finally{setLoading(false);setOrdersLoading(false);}
  };
  load();
 },[navigate]);

 const handleLogout=()=>{
  localStorage.removeItem("auth_token");localStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_token");sessionStorage.removeItem("auth_user");
  navigate("/");
 };

 if(loading||!user)return <><Header/><main className="account-v2" style={{paddingTop:"clamp(44px,4vw,56px)"}}><div className="account-v2__loading"><RefreshCw className="account-v2__spin" size={30}/><strong>{isEs?"Preparando tu cuenta...":"Preparing your account..."}</strong><span>{isEs?"Un momento, estamos cargando tu espacio personal.":"One moment, we're loading your personal space."}</span></div></main><Footer/></>;

 const registrationDate=new Date(user.created_at).toLocaleDateString(isEs?"es-US":"en-US",{month:"short",day:"numeric",year:"numeric"});
 const totalSpent=orders.reduce((sum,order)=>sum+Number(order.total||0),0);
 const totalItems=orders.reduce((sum,order)=>sum+order.items.reduce((itemSum,item)=>itemSum+Number(item.quantity||0),0),0);

 return <>
  <Header/>
  <main className="account-v2" style={{paddingTop:"clamp(44px,4vw,56px)"}}>
   <div className="account-v2__ambient account-v2__ambient--one"/>
   <div className="account-v2__ambient account-v2__ambient--two"/>
   <div className="account-v2__shell">
    <section className="account-v2__hero">
     <div><span className="account-v2__eyebrow">{isEs?"MI CUENTA":"MY ACCOUNT"}</span><h1>{isEs?`Bienvenido de nuevo, ${user.first_name}`:`Welcome back, ${user.first_name}`} <span>✦</span></h1><p>{isEs?"Administra tus pedidos, reseñas y detalles de cuenta desde un solo lugar.":"Manage your orders, reviews, and account details — all in one place."}</p></div>
    </section>
    <div className="account-v2__layout">
     <aside className="account-v2__sidebar">
      <div className="account-v2__side-title"><ShieldCheck size={17}/>{isEs?"Espacio del cliente":"Customer space"}</div>
      <button className="account-v2__side-link account-v2__side-link--active" type="button"><UserRound size={17}/>{isEs?"Panel principal":"Dashboard"}</button>
      <button className="account-v2__side-link" type="button" onClick={()=>navigate("/account/orders")}><Package size={17}/>{isEs?"Últimas compras":"Recent purchases"}<ChevronRight size={15}/></button>
      <button className="account-v2__side-link" type="button" onClick={()=>navigate("/account/reviews")}><Star size={17}/>{isEs?"Mis reviews":"My reviews"}<ChevronRight size={15}/></button>
      <div className="account-v2__side-divider"/>
      <button className="account-v2__side-link account-v2__side-link--logout" type="button" onClick={handleLogout}><LogOut size={17}/>{isEs?"Cerrar sesión":"Log out"}</button>
     </aside>
     <div className="account-v2__content">
      <section className="account-v2__profile-card">
       <div className="account-v2__avatar">{user.first_name?.charAt(0).toUpperCase()||"U"}</div>
       <div className="account-v2__profile-main"><span className="account-v2__profile-label">{isEs?"CUENTA VERIFICADA":"VERIFIED ACCOUNT"}</span><h2>{user.first_name} {user.last_name}</h2><p>{user.email}</p><span className="account-v2__verified"><CheckCircle2 size={13}/>{isEs?"Cuenta activa":"Active account"}</span></div>
       <div className="account-v2__profile-meta"><div><span>{isEs?"Miembro desde":"Account since"}</span><strong>{registrationDate}</strong></div><div><span>{isEs?"Usuario":"Username"}</span><strong>@{user.username}</strong></div></div>
      </section>
      <section className="account-v2__stats"><div><Package size={20}/><span>{isEs?"Pedidos":"Orders"}</span><strong>{orders.length}</strong></div><div><Star size={20}/><span>{isEs?"Artículos comprados":"Items purchased"}</span><strong>{totalItems}</strong></div><div><span className="account-v2__stat-dollar">$</span><span>{isEs?"Total comprado":"Total spent"}</span><strong>{money(totalSpent)}</strong></div></section>
      <section className="account-v2__section">
       <div className="account-v2__section-heading"><div><span className="account-v2__section-kicker">{isEs?"TU ACTIVIDAD":"YOUR ACTIVITY"}</span><h2>{isEs?"Últimas compras":"Recent purchases"}</h2><p>{isEs?"Tus pedidos más recientes, directamente desde tu historial.":"Your latest orders, directly from your purchase history."}</p></div>{orders.length>0&&<button type="button" className="account-v2__view-all" onClick={()=>navigate("/account/orders")}>{isEs?"Ver todo":"View all"}<ArrowRight size={15}/></button>}</div>
       {ordersLoading?<div className="account-v2__orders-loading"><RefreshCw className="account-v2__spin" size={22}/>{isEs?"Cargando pedidos...":"Loading orders..."}</div>:orders.length===0?<div className="account-v2__empty"><div><Package size={27}/></div><strong>{isEs?"Aún no tienes compras":"No purchases yet"}</strong><span>{isEs?"Tu primera compra aparecerá aquí.":"Your first purchase will appear here."}</span><button type="button" onClick={()=>navigate("/collections")}>{isEs?"Explorar colecciones":"Explore collections"}<ArrowRight size={15}/></button></div>:<div className="account-v2__orders">{orders.slice(0,3).map(order=><article className="account-v2__order" key={order.id}><div className="account-v2__order-image">{order.items[0]?.image_url?<img src={order.items[0].image_url} alt=""/>:<Package size={21}/>}</div><div className="account-v2__order-main"><strong>{order.order_code}</strong><span><CalendarDays size={13}/>{new Date(order.created_at).toLocaleDateString(isEs?"es-US":"en-US",{month:"short",day:"numeric",year:"numeric"})} · {order.items.length} {isEs?"productos":"items"}</span><small>{order.items.slice(0,2).map(item=>`${item.product_name} ×${item.quantity}`).join(" · ")}{order.items.length>2?` +${order.items.length-2} ${isEs?"más":"more"}`:""}</small></div><div className="account-v2__order-right"><span className={`account-v2__status account-v2__status--${order.status}`}>{statusLabel(order.status,isEs)}</span><strong>{money(order.total,order.currency)}</strong><button type="button" onClick={()=>navigate("/account/orders")}>{isEs?"Detalles":"Details"}<ChevronRight size={14}/></button></div></article>)}</div>}
      </section>
      <section className="account-v2__quick"><div className="account-v2__section-heading"><div><span className="account-v2__section-kicker">{isEs?"ACCESO RÁPIDO":"QUICK ACCESS"}</span><h2>{isEs?"¿Qué quieres hacer?":"What would you like to do?"}</h2></div></div><div className="account-v2__quick-grid"><button type="button" onClick={()=>navigate("/account/orders")}><Package size={22}/><strong>{isEs?"Últimas compras":"Recent purchases"}</strong><span>{isEs?"Ver y rastrear tus pedidos":"View and track your orders"}</span><ArrowRight size={15}/></button><button type="button" onClick={()=>navigate("/account/reviews")}><Star size={22}/><strong>{isEs?"Mis reviews":"My reviews"}</strong><span>{isEs?"Comparte tu experiencia":"Share your experience"}</span><ArrowRight size={15}/></button><button type="button" onClick={()=>document.getElementById("account-details")?.scrollIntoView({behavior:"smooth",block:"center"})}><UserRound size={22}/><strong>{isEs?"Detalles de cuenta":"Account details"}</strong><span>{isEs?"Revisa tu información":"Review your information"}</span><ArrowRight size={15}/></button></div></section>
      <section className="account-v2__details" id="account-details"><div><span>{isEs?"USUARIO":"USERNAME"}</span><strong>@{user.username}</strong></div><div><span>{isEs?"CORREO":"EMAIL"}</span><strong>{user.email}</strong></div><div><span>{isEs?"NOMBRE COMPLETO":"FULL NAME"}</span><strong>{user.first_name} {user.last_name}</strong></div><div><span>{isEs?"ESTADO":"STATUS"}</span><strong>{user.is_active?(isEs?"Cuenta activa":"Active account"):(isEs?"Cuenta inactiva":"Inactive account")}</strong></div></section>
      <button type="button" className="account-v2__logout" onClick={handleLogout}><LogOut size={17}/>{isEs?"CERRAR SESIÓN":"LOG OUT"}</button>
     </div>
    </div>
   </div>
  </main>
  <Footer/>
 </>;
}

export default Account;
