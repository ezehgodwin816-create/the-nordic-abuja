
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const toast=(msg)=>{const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)};
const today=new Date().toISOString().slice(0,10);
const ci=$('#checkin'),co=$('#checkout'); if(ci){ci.min=today;ci.addEventListener('change',()=>{if(co){co.min=ci.value; if(co.value&&co.value<=ci.value)co.value=''}})}
const bookingBtn=$('#bookingButton'); if(bookingBtn)bookingBtn.addEventListener('click',()=>{const a=ci?.value,b=co?.value,g=$('#guests')?.value||'2 guests';if(!a||!b){toast('Please select your check-in and check-out dates.');return}location.href=`booking.html?checkin=${encodeURIComponent(a)}&checkout=${encodeURIComponent(b)}&guests=${encodeURIComponent(g)}`});
const header=$('#siteHeader');addEventListener('scroll',()=>{if(header)header.classList.toggle('scrolled',scrollY>40)});
const menu=$('#mobileMenu'); $$('.menu-toggle').forEach(b=>b.addEventListener('click',()=>{menu?.classList.toggle('open')}));
const lb=$('#lightbox'); $$('.gallery-item').forEach(i=>i.addEventListener('click',()=>{if(!lb)return;$('#lightboxImage').src=i.dataset.lightbox;$('#lightboxCaption').textContent=i.dataset.caption||'';lb.classList.add('open');lb.setAttribute('aria-hidden','false')})); $('#lightbox')?.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lightbox-close')){lb.classList.remove('open');lb.setAttribute('aria-hidden','true')}});
$('#backTop')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
const cp=$('#conciergePanel');$('#conciergeOpen')?.addEventListener('click',()=>cp?.classList.add('open'));$('#conciergeClose')?.addEventListener('click',()=>cp?.classList.remove('open'));
$('#year')&&( $('#year').textContent=new Date().getFullYear() );
// Demo booking flow: keeps selections locally until Supabase/payment is connected.
function params(){return new URLSearchParams(location.search)}
if($('#bookingForm')){const p=params(); const set=(id,v)=>{const e=$('#'+id);if(e&&v)e.value=v};set('bookingCheckin',p.get('checkin'));set('bookingCheckout',p.get('checkout'));set('bookingGuests',p.get('guests'));
const form=$('#bookingForm');form.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));localStorage.setItem('nordic_booking_draft',JSON.stringify(data));location.href='booking-success.html'})}
$$('[data-book-room]').forEach(b=>b.addEventListener('click',()=>{const room=b.dataset.bookRoom;location.href=`booking.html?room=${encodeURIComponent(room)}`}));
$$('[data-demo-submit]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();toast('Request saved on this device. Connect Supabase to receive it in the hotel dashboard.');f.reset()}));
