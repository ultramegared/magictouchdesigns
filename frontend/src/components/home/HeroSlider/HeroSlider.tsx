import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import { translations } from "../../../translations";
import "./HeroSlider.css";

type Text={en:string;es:string};
type Slide={id:string;image:string;background:string;order:number;active:boolean;title:Text;subtitle:Text;primaryButton:Text;primaryLink:string;secondaryButton:Text;secondaryLink:string};
const fallback:Slide[]=[
{id:"hero-1",image:"/images/hero/hero-mug.png",background:"/images/hero/hero-background.jpg",order:1,active:true,title:{en:"YOUR STORY.\nYOUR MUG.",es:"TU HISTORIA.\nTU TAZA."},subtitle:{en:"Design a premium personalized mug with your name, logo or favorite photo. Crafted to create unforgettable gifts and lasting memories.",es:"Diseña una taza personalizada premium con tu nombre, logo o foto favorita.",},primaryButton:{en:"CREATE YOUR MUG",es:"CREA TU TAZA"},primaryLink:"/customize",secondaryButton:{en:"SHOP MUGS",es:"COMPRAR TAZAS"},secondaryLink:"/products"},
{id:"hero-2",image:"/images/hero/hero-cap.png",background:"/images/hero/hero-background.jpg",order:2,active:true,title:{en:"WEAR\nYOUR BRAND.",es:"LLEVA\nTU MARCA."},subtitle:{en:"Create premium custom caps with your logo, business name or team design.",es:"Crea gorras personalizadas premium con tu logo, negocio o equipo."},primaryButton:{en:"CREATE YOUR CAP",es:"CREA TU GORRA"},primaryLink:"/customize",secondaryButton:{en:"SHOP CAPS",es:"COMPRAR GORRAS"},secondaryLink:"/products"},
{id:"hero-3",image:"/images/hero/hero-shirt.png",background:"/images/hero/hero-background.jpg",order:3,active:true,title:{en:"YOUR STYLE.\nYOUR SHIRT.",es:"TU ESTILO.\nTU CAMISETA."},subtitle:{en:"Design premium custom t-shirts with your logo, artwork or business branding.",es:"Diseña camisetas personalizadas premium con tu logo, arte o marca."},primaryButton:{en:"CREATE YOUR SHIRT",es:"CREA TU CAMISETA"},primaryLink:"/customize",secondaryButton:{en:"SHOP T-SHIRTS",es:"COMPRAR CAMISETAS"},secondaryLink:"/products"}
];
function HeroSlider(){const {language}=useLanguage();const t=translations[language].home.hero;const [slides,setSlides]=useState<Slide[]>(fallback);const [current,setCurrent]=useState(0);const [paused,setPaused]=useState(false);
 useEffect(()=>{apiRequest<{status:string;settings:{config:{heroSlides:Slide[]}}}>("/api/settings").then(r=>{const active=(r.settings.config.heroSlides||[]).filter(x=>x.active).sort((a,b)=>a.order-b.order);if(active.length)setSlides(active);}).catch(()=>{});},[]);
 useEffect(()=>{if(paused||slides.length<2)return;const timer=window.setInterval(()=>setCurrent(v=>(v+1)%slides.length),8000);return()=>window.clearInterval(timer);},[paused,slides.length]);
 useEffect(()=>{if(current>=slides.length)setCurrent(0);},[current,slides.length]);
 const slide=slides[current]||slides[0];const text=language==="es"?slide.title.es||slide.title.en:slide.title.en;const subtitle=language==="es"?slide.subtitle.es||slide.subtitle.en:slide.subtitle.en;const primary=language==="es"?slide.primaryButton.es||slide.primaryButton.en:slide.primaryButton.en;const secondary=language==="es"?slide.secondaryButton.es||slide.secondaryButton.en:slide.secondaryButton.en;
 return <section className="hero-slider" style={{backgroundImage:`linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${slide.background})`}} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}>
  <button type="button" className="hero-slider__arrow hero-slider__arrow--left" onClick={()=>setCurrent(v=>v===0?slides.length-1:v-1)} aria-label={t.previousSlide}><ChevronLeft size={26}/></button><div className="hero-slider__overlay"/>
  <div className="hero-slider__content"><div key={slide.id} className="hero-slider__text"><h1>{text}</h1><p>{subtitle}</p></div><div className="hero-slider__image"><img src={slide.image} alt={text.replace("\n"," ")}/></div><div className="hero-slider__buttons"><button type="button" className="hero-slider__primary" onClick={()=>window.location.href=slide.primaryLink}>{primary}</button><button type="button" className="hero-slider__secondary" onClick={()=>window.location.href=slide.secondaryLink}>{secondary}</button></div></div>
  <button type="button" className="hero-slider__arrow hero-slider__arrow--right" onClick={()=>setCurrent(v=>(v+1)%slides.length)} aria-label={t.nextSlide}><ChevronRight size={26}/></button><div className="hero-slider__dots">{slides.map((x,i)=><button type="button" key={x.id} className={i===current?"hero-slider__dot hero-slider__dot--active":"hero-slider__dot"} onClick={()=>setCurrent(i)} aria-label={`${t.goToSlide} ${i+1}`}/>)}</div>
 </section>;
}
export default HeroSlider;
