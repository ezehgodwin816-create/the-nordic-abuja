const header=document.getElementById("siteHeader");const mobileMenu=document.getElementById("mobileMenu");const menuButtons=document.querySelectorAll(".menu-toggle");const toast=document.getElementById("toast");const year=document.getElementById("year");if(year)year.textContent=new Date().getFullYear();

window.addEventListener("scroll",()=>{header?.classList.toggle("scrolled",window.scrollY>50);document.getElementById("backTop")?.classList.toggle("show",window.scrollY>500)});

menuButtons.forEach(btn=>btn.addEventListener("click",()=>{const open=!mobileMenu.classList.contains("open");mobileMenu.classList.toggle("open",open);mobileMenu.setAttribute("aria-hidden",String(!open));document.querySelector(".menu-toggle")?.setAttribute("aria-expanded",String(open));document.body.style.overflow=open?"hidden":""}));
mobileMenu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mobileMenu.classList.remove("open");mobileMenu.setAttribute("aria-hidden","true");document.body.style.overflow=""}));

const checkin=document.getElementById("checkin"),checkout=document.getElementById("checkout");const today=new Date();const iso=d=>d.toISOString().split("T")[0];if(checkin){checkin.min=iso(today);const tomorrow=new Date(today);tomorrow.setDate(today.getDate()+1);checkout.min=iso(tomorrow);checkin.addEventListener("change",()=>{const d=new Date(checkin.value+"T00:00:00");d.setDate(d.getDate()+1);checkout.min=iso(d);if(checkout.value&&checkout.value<=checkin.value)checkout.value=iso(d)})}
document.getElementById("bookingButton")?.addEventListener("click",()=>{if(!checkin.value||!checkout.value){showToast("Choose your check-in and check-out dates first.");return}showToast("Booking engine connection will be added when the hotel's live reservation system is connected.")});

const lightbox=document.getElementById("lightbox"),lbImg=document.getElementById("lightboxImage"),lbCaption=document.getElementById("lightboxCaption");document.querySelectorAll("[data-lightbox]").forEach(item=>item.addEventListener("click",()=>{lbImg.src=item.dataset.lightbox;lbCaption.textContent=item.dataset.caption||"";lightbox.classList.add("open");lightbox.setAttribute("aria-hidden","false");document.body.style.overflow="hidden"}));document.querySelector(".lightbox-close")?.addEventListener("click",closeLightbox);lightbox?.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox()});function closeLightbox(){lightbox.classList.remove("open");lightbox.setAttribute("aria-hidden","true");document.body.style.overflow=""}

const concierge=document.getElementById("conciergePanel");document.getElementById("conciergeOpen")?.addEventListener("click",()=>{concierge.classList.add("open");concierge.setAttribute("aria-hidden","false")});document.getElementById("conciergeClose")?.addEventListener("click",()=>{concierge.classList.remove("open");concierge.setAttribute("aria-hidden","true")});

document.getElementById("backTop")?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove("show"),4200)}

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeLightbox();concierge?.classList.remove("open");mobileMenu?.classList.remove("open");document.body.style.overflow=""}});