// Zofed Foods - Central Cart Logic (Android/iOS safe)
try{ window.zCart = JSON.parse(localStorage.getItem('zofed_cart')||'[]'); }catch(e){ window.zCart = []; }
if(!Array.isArray(window.zCart)) window.zCart = [];
function saveZCart(){ try{ localStorage.setItem('zofed_cart', JSON.stringify(window.zCart)); }catch(e){} }
function toggleZCart(open){
  const d=document.getElementById('z-cart-drawer');
  if(!d) return;
  if(open){
    d.classList.add('open');
    try{ renderZCart(); }catch(e){ console.error(e); }
    // Android: prevent background scroll but allow drawer scroll
    try{
      document.body.style.overflow='hidden';
      document.documentElement.style.overflow='hidden';
      // prevent touchmove on body, allow on drawer
      document.body.style.touchAction='none';
    }catch(e){}

  } else {
    d.classList.remove('open');
    try{
      document.body.style.overflow='';
      document.documentElement.style.overflow='';
      document.body.style.touchAction='';
    }catch(e){}

  }
}
function addToZCart(name, price){
  const ex = window.zCart.find(i=>i.name===name);
  if(ex) ex.qty += 1;
  else window.zCart.push({name, price: Number(price), qty:1});
  saveZCart(); updBadge(); updateMobileCart(); toggleZCart(true);
  // toast
  showToast(`${name} added to cart`);
}
function updBadge(){
  const c=document.getElementById('cart-count');
  if(c) c.textContent = window.zCart.reduce((s,i)=>s+i.qty,0);
}
function updQty(idx, delta){
  if(!window.zCart[idx]) return;
  window.zCart[idx].qty += delta;
  if(window.zCart[idx].qty <= 0) window.zCart.splice(idx,1);
  saveZCart(); updBadge(); updateMobileCart(); renderZCart();
}
function updateMobileCart(){}
function renderZCart(){
  const list=document.getElementById('z-cart-items'), subEl=document.getElementById('z-sub'), shipEl=document.getElementById('z-ship-fee'), totEl=document.getElementById('z-total'), fill=document.getElementById('z-ship-fill'), txt=document.getElementById('z-ship-text'), btn=document.getElementById('z-checkout'), buyBtn=document.getElementById('z-buy-now'), form=document.getElementById('z-form-section');
  if(!list) return;
  if(window.zCart.length===0){
    list.innerHTML='<p style="text-align:center;color:var(--muted);font-size:13px;padding:20px 0;font-style:italic">Your cart is empty — add a 250gm pack!</p>';
    if(subEl) subEl.textContent='₹0';
    if(shipEl) shipEl.textContent='₹0';
    if(totEl) totEl.textContent='₹0';
    if(fill) fill.style.width='0%';
    if(txt) txt.innerHTML='<span style="color:var(--forest)">Add items worth ₹499 for FREE Delivery</span><span style="color:var(--terracotta)" id="z-ship-rem">₹499 left</span>';
    if(btn) btn.disabled=true;
    if(buyBtn) buyBtn.disabled=true;
    if(form) form.style.display='none';
    return;
  }
  if(btn) btn.disabled=false;
  if(buyBtn){ buyBtn.disabled=false; buyBtn.style.display='flex'; }
  if(form) form.style.display='grid';
  let html='', sub=0;
  window.zCart.forEach((p,i)=>{
    const t=p.price*p.qty; sub+=t;
    html+=`<div class="z-item"><div style="flex:1"><b style="color:var(--forest);font-size:13px">${p.name}</b><div style="font-size:11px;color:var(--muted)">₹${p.price} each • 250gm</div></div><div style="display:flex;align-items:center;gap:10px"><div class="z-qty"><button onclick="updQty(${i},-1)" aria-label="Decrease">-</button><span>${p.qty}</span><button onclick="updQty(${i},1)" aria-label="Increase">+</button></div><b style="color:var(--forest);min-width:56px;text-align:right">₹${t}</b></div></div>`;
  });
  list.innerHTML=html;
  const thr=499; let fee=0;
  if(sub>=thr){
    if(fill) fill.style.width='100%';
    if(txt) txt.innerHTML='<span style="color:var(--forest);font-weight:800">🎉 Congratulations! You unlocked FREE Delivery!</span>';
    if(shipEl){ shipEl.textContent='FREE'; shipEl.style.color='#16A34A'; }
  } else {
    const rem=thr-sub, pct=Math.min(sub/thr*100,100);
    if(fill) fill.style.width=pct+'%';
    if(txt) txt.innerHTML=`<span style="color:var(--forest)">Add ₹${rem} more for FREE Delivery</span><span style="color:var(--terracotta);font-weight:800">₹${rem} left</span>`;
    fee=50;
    if(shipEl){ shipEl.textContent='₹50'; shipEl.style.color='var(--ink)'; }
  }
  if(subEl) subEl.textContent='₹'+sub;
  if(totEl) totEl.textContent='₹'+(sub+fee);
  if(buyBtn) buyBtn.textContent = `⚡ Buy Now — Pay ₹${sub+fee} Online`;
}
function selectPay(el,val){
  document.querySelectorAll('.z-pay-option').forEach(o=>o.classList.remove('active'));
  if(el) el.classList.add('active');
  if(el) el.querySelector('input').checked=true;
  const b=document.getElementById('z-checkout');
  if(b) b.textContent = val==='online' ? 'Pay Online via Razorpay →' : 'Proceed via WhatsApp →';
  // keep Buy Now always visible after cart has items
  const buyB=document.getElementById('z-buy-now');
  if(buyB){ buyB.style.display='flex'; buyB.disabled = window.zCart.length===0; }
}
function handleCheckout(){
  const opt=document.querySelector('input[name="payOpt"]:checked')?.value || document.getElementById('z-pay')?.value || 'cod';
  if(opt==='online') initiatePayment('online');
  else checkoutZ();
}
function buyNowCart(){
  if(window.zCart.length===0){ alert('Your cart is empty. Add a product first.'); return; }
  initiatePayment('online');
}
function checkoutZ(){
  const nameEl=document.getElementById('z-name'), phoneEl=document.getElementById('z-phone'), addrEl=document.getElementById('z-address'), cityEl=document.getElementById('z-city'), pinEl=document.getElementById('z-pincode'), payEl=document.getElementById('z-pay');
  const name=nameEl? nameEl.value.trim(): '', phone=phoneEl? phoneEl.value.trim(): '', addr=addrEl? addrEl.value.trim(): '', city=cityEl? (cityEl.value.trim()||'Bhopal, MP'):'Bhopal, MP', pin=pinEl? pinEl.value.trim(): '', pay=payEl? payEl.value: (document.querySelector('input[name="payOpt"]:checked')?.value||'COD');
  if(!name||!phone||!addr||!pin){
    alert('Please fill Name, WhatsApp Number, Complete Address and Pincode.');
    return;
  }
  let sub=0, lines='';
  window.zCart.forEach((p,i)=>{ const t=p.price*p.qty; sub+=t; lines+=`${i+1}. ${p.name} (250g) x ${p.qty} - ₹${t}\n`; });
  if(window.zCart.length===0){ alert('Your cart is empty. Add a product first.'); return; }
  const fee=sub>=499?0:50, shipLabel=fee===0?'FREE (Unlocked above ₹499)':'₹50', total=sub+fee, ref='ZF-'+Math.floor(100000+Math.random()*900000);
  const msg=`*NEW ORDER REQUEST - ZOFED FOODS*\n*Order Ref:* #${ref}\n\n*ORDER ITEMS:*\n${lines}\n*PAYMENT SUMMARY:*\n• *Item Subtotal:* ₹${sub}\n• *Delivery Fee:* ${shipLabel}\n• *Total Amount Payable:* ₹${total}\n\n*DELIVERY DETAILS:*\n• *Customer Name:* ${name}\n• *Phone:* ${phone}\n• *Address:* ${addr}\n• *City:* ${city}\n• *Pincode:* ${pin}\n• *Payment:* ${pay}\n\n_Please confirm availability and share payment details._`;
  window.open(`https://wa.me/917240975556?text=${encodeURIComponent(msg)}`,'_blank');
}
function showToast(msg){
  let t=document.getElementById('z-toast');
  if(!t){
    t=document.createElement('div');
    t.id='z-toast';
    t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--forest);color:white;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:700;z-index:80;box-shadow:0 8px 24px rgba(0,0,0,.18);opacity:0;transition:opacity .25s, transform .25s;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent=msg;
  t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; }, 2200);
}
// expose for inline scripts that used let zCart
var zCart = window.zCart;
document.addEventListener('DOMContentLoaded', ()=>{ updBadge(); updateMobileCart(); });
// close drawer on backdrop click or ESC
document.addEventListener('keydown', e=>{ if(e.key==='Escape') toggleZCart(false); });
