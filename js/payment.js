// Zofed Foods - Payment Gateway Integration
// Supports: Razorpay, UPI, COD, PhonePe, Paytm
// HOW TO ENABLE:
// 1. Get Razorpay Key from https://dashboard.razorpay.com/app/keys
// 2. Replace RAZORPAY_KEY below
// 3. Add <script src="https://checkout.razorpay.com/v1/checkout.js"></script> in <head> (already queued)
// 4. For backend verification, create /api/verify-payment endpoint (optional for COD-only flow)

const PAYMENT_CONFIG = {
  RAZORPAY_KEY: "rzp_test_YOUR_KEY_HERE", // <-- REPLACE WITH LIVE KEY
  COMPANY_NAME: "Zofed Foods",
  CURRENCY: "INR",
  // Set to true to enable test mode banner
  TEST_MODE: true
};

function getCartTotalForPayment(){
  const cart = (typeof window.zCart !== 'undefined' ? window.zCart : (typeof zCart !== 'undefined' ? zCart : []));
  const sub = cart.reduce((s,i)=> s + i.price * i.qty, 0);
  const fee = sub >= 499 ? 0 : (sub > 0 ? 50 : 0);
  return { subtotal: sub, shipping: fee, total: sub + fee };
}

function initiatePayment(method){
  const { total, subtotal, shipping } = getCartTotalForPayment();
  if(total === 0){
    alert('Your cart is empty. Add a 250gm pack first.');
    return;
  }

  // Collect customer details if available
  const nameEl = document.getElementById('z-name');
  const phoneEl = document.getElementById('z-phone');
  const addrEl  = document.getElementById('z-address');

  // For Razorpay - validate before opening
  if(method === 'razorpay' || method === 'online'){
    if(PAYMENT_CONFIG.RAZORPAY_KEY.includes('YOUR_KEY')){
      // Fallback to WhatsApp + UPI instruction if key not set
      const proceed = confirm('Razorpay key not configured yet.\n\nClick OK to pay via UPI/WhatsApp, or configure js/payment.js -> RAZORPAY_KEY to enable cards/netbanking.\n\nProceed with WhatsApp checkout?');
      if(proceed) checkoutZ();
      return;
    }
    if(typeof Razorpay === 'undefined'){
      alert('Razorpay SDK not loaded. Check internet or add: <script src="https://checkout.razorpay.com/v1/checkout.js">');
      checkoutZ();
      return;
    }
    const options = {
      key: PAYMENT_CONFIG.RAZORPAY_KEY,
      amount: total * 100, // paise
      currency: PAYMENT_CONFIG.CURRENCY,
      name: PAYMENT_CONFIG.COMPANY_NAME,
      description: `Zofed Order - ${(window.zCart||[]).length} items (Subtotal ₹${subtotal} + Shipping ₹${shipping})`,
      image: "https://via.placeholder.com/128x128/9B1C1C/FFFFFF?text=ZF",
      prefill: {
        name: nameEl ? nameEl.value : "",
        contact: phoneEl ? phoneEl.value : "",
      },
      notes: {
        address: addrEl ? addrEl.value : "",
        items: (window.zCart||[]).map(i=> `${i.name} x${i.qty}`).join(', ')
      },
      theme: { color: "#9B1C1C" },
      handler: function(resp){
        const cart = window.zCart||[];
        const msg = `*PAYMENT SUCCESS - ZOFED FOODS*\n*Payment ID:* ${resp.razorpay_payment_id}\n*Amount Paid:* ₹${total}\n*Items:* ${cart.map(i=> `${i.name} x${i.qty}`).join(', ')}\n*Customer:* ${nameEl? nameEl.value : ''} - ${phoneEl? phoneEl.value : ''}`;
        window.open(`https://wa.me/message/K53GKHKZ3VELK1?text=${encodeURIComponent(msg)}`,'_blank');
        // Optionally clear cart & show thank you
        alert('Payment successful! Payment ID: ' + resp.razorpay_payment_id + '\nWe have opened WhatsApp for order confirmation.');
      },
      modal: {
        ondismiss: function(){ console.log('Razorpay closed'); }
      }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(res){ alert('Payment failed: ' + res.error.description); });
    rzp.open();
  } else if(method === 'cod'){
    checkoutZ(); // existing WhatsApp flow for COD
  } else if(method === 'upi'){
    // Show UPI QR / ID instruction then fallback to WhatsApp
    checkoutZ();
  }
}

// Buy Now = direct checkout for single product - uses window.zCart for cross-scope compatibility
function buyNow(productName, price){
  window.zCart = [{ name: productName, price: price, qty: 1 }];
  // also update legacy let variable if exists (for inline scripts using let)
  try{ zCart = window.zCart; }catch(e){}
  if(window.saveZCart) window.saveZCart();
  else { try{ localStorage.setItem('zofed_cart', JSON.stringify(window.zCart)); }catch(e){} }
  if(typeof updBadge === 'function') updBadge();
  if(typeof window.updBadge === 'function') window.updBadge();
  if(typeof updateMobileCart === 'function') updateMobileCart();
  if(typeof window.updateMobileCart === 'function') window.updateMobileCart();
  if(typeof toggleZCart === 'function') toggleZCart(true);
  setTimeout(()=> {
    const el = document.getElementById('z-pay');
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

// Expose for console testing
window.ZOFED_PAYMENT = { initiatePayment, buyNow, PAYMENT_CONFIG };
