/* ---------- helpers: safe DOM and utilities ---------- */

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function bytesToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function hashPassword(password) {
  // returns hex string of SHA-256(password)
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(hashBuffer);
}

function readUsers() {
  try {
    const raw = localStorage.getItem('pashleUsers');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('readUsers error', e);
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem('pashleUsers', JSON.stringify(users));
}

function setAuth(authObj) {
  // authObj: { name, email }
  if (authObj) {
    localStorage.setItem('pashleAuth', JSON.stringify(authObj));
  } else {
    localStorage.removeItem('pashleAuth');
  }
}

function getAuth() {
  try {
    const raw = localStorage.getItem('pashleAuth');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/* ---------- Auth UI: update navbar based on auth ---------- */
function renderAuthInNavbar() {
  const authArea = $('#auth-area');
  if (!authArea) return;
  const auth = getAuth();
  if (auth && auth.name) {
    authArea.innerHTML = `
      <span class="nav-user">Hi, ${auth.name.split(' ')[0]}</span>
      <button id="logout-btn" class="shop-btn" style="padding:6px 10px; font-size:0.95rem;">Logout</button>
    `;
    const logoutBtn = $('#logout-btn');
    logoutBtn && logoutBtn.addEventListener('click', () => {
      setAuth(null);
      renderAuthInNavbar();
      // Optionally redirect to home
      window.location.href = 'index.html';
    });
  } else {
    authArea.innerHTML = `<a href="login.html" id="login-link">Login / Register</a>`;
  }
}

/* ---------- Smooth scroll for nav anchors ---------- */
document.querySelectorAll('.navbar-right a').forEach(link => {
  link.addEventListener('click', function(e){
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const t = document.querySelector(href);
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ---------- DOMContentLoaded: run main app logic ---------- */
document.addEventListener('DOMContentLoaded', function() {
  renderAuthInNavbar();

  /* ---------------- CART ---------------- */
  (function cartModule(){
    const cartItemsContainer = document.querySelector('.cart-items');
    const addCartButtons = document.querySelectorAll('.add-cart');
    const checkoutBtn = document.querySelector('.checkout');

    let cart = [];

    function loadCart() {
      try {
        const raw = localStorage.getItem('pashleCart');
        cart = raw ? JSON.parse(raw) : [];
      } catch (e) { cart = []; }
    }
    function saveCart() {
      try { localStorage.setItem('pashleCart', JSON.stringify(cart)); } catch(e){}
    }
    function formatINR(num) {
      return '₹' + Number(num).toLocaleString('en-IN');
    }

    function renderCart() {
      if (!cartItemsContainer) return;
      cartItemsContainer.innerHTML = '';
      if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        return;
      }
      let total = 0;
      cart.forEach((item, idx) => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${item.img}" alt="${item.name}" class="cart-item-img" loading="lazy" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid ${'#ff69b4'};background:#fff;">
          <div class="cart-item-details" style="flex:1;text-align:left;">
            <div class="cart-item-name" style="color:#ff69b4;font-weight:600">${item.name}</div>
            <div class="cart-item-price">${item.priceFormatted}</div>
          </div>
          <button class="cart-btn remove-item" data-idx="${idx}" aria-label="Remove ${item.name}">Remove</button>
        `;
        cartItemsContainer.appendChild(div);
      });

      const totalEl = document.createElement('div');
      totalEl.style.marginTop = '1rem';
      totalEl.style.textAlign = 'right';
      totalEl.innerHTML = `<strong>Total: ${formatINR(total)}</strong>`;
      cartItemsContainer.appendChild(totalEl);

      cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function(){
          const idx = parseInt(this.getAttribute('data-idx'));
          if (!Number.isNaN(idx)) {
            cart.splice(idx,1);
            saveCart();
            renderCart();
          }
        });
      });
    }

    addCartButtons.forEach(btn => {
      btn.addEventListener('click', function(){
        const card = btn.closest('.product-card');
        if (!card) return;
        const name = (card.querySelector('h3') && card.querySelector('h3').innerText.trim()) || 'Product';
        const priceText = (card.querySelector('.product-price') && card.querySelector('.product-price').innerText.replace(/[₹, ]/g,'').trim()) || '0';
        const price = Number(priceText) || 0;
        const img = (card.querySelector('img') && card.querySelector('img').getAttribute('src')) || '';
        cart.push({
          name,
          price,
          img,
          priceFormatted: card.querySelector('.product-price') ? card.querySelector('.product-price').innerText.trim() : ('₹'+price)
        });
        saveCart();
        renderCart();
        const cartSection = document.querySelector('#cart');
        if (cartSection) cartSection.scrollIntoView({ behavior:'smooth' });
      });
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(){
        if (!cart.length) {
          alert('Your cart is empty.');
          return;
        }
        // Placeholder for real checkout gateway
 alert(
      "⚠️ Oops! Our servers are overloaded due to high demand.\n\n" +
      "Due to this inconvenience, we’re offering a special discount on shipping charges if you order directly through:\n\n" +
      "📱 WhatsApp 📸 Instagram 📧 Email options in contact \n\n"+
      "You can also directly send us message through contact option "+
      "🙏 Sorry for the trouble & thank you for your support!"
    );
      });
    }

    loadCart();
    renderCart();
  })();

  /* ------------- TESTIMONIALS ------------- */
  (function carouselModule(){
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    const leftArrow = document.querySelector('.carousel-arrow.left');
    const rightArrow = document.querySelector('.carousel-arrow.right');
    if (!cards.length) return;
    let current = 0;
    let interval;
    function showCard(idx) {
      idx = ((idx % cards.length) + cards.length) % cards.length;
      cards.forEach((card,i)=>card.classList.toggle('active', i===idx));
      dots.forEach((dot,i)=>dot.classList.toggle('active', i===idx));
      current = idx;
    }
    function nextCard(){ showCard(current+1); }
    function prevCard(){ showCard(current-1); }
    function start(){ stop(); interval = setInterval(nextCard, 3500); }
    function stop(){ if (interval) { clearInterval(interval); interval=null; } }
    leftArrow && leftArrow.addEventListener('click', ()=>{ stop(); prevCard(); start(); });
    rightArrow && rightArrow.addEventListener('click', ()=>{ stop(); nextCard(); start(); });
    dots.forEach((dot,i)=>dot.addEventListener('click', ()=>{ stop(); showCard(i); start(); }));
    showCard(0); start();
  })();

  /* ---------- AUTH: register & login page handlers ---------- */
  (function authModule(){
    // Register page
    const regForm = $('#register-form');
    if (regForm) {
      const msg = $('#reg-message');
      regForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const name = (document.getElementById('reg-name')||{}).value.trim();
        const email = (document.getElementById('reg-email')||{}).value.trim().toLowerCase();
        const pw = (document.getElementById('reg-password')||{}).value;
        const pwc = (document.getElementById('reg-password-confirm')||{}).value;
        msg.textContent = '';
        if (!name || !email || !pw) { msg.textContent = 'Please complete all fields.'; return; }
        if (pw.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
        if (pw !== pwc) { msg.textContent = 'Passwords do not match.'; return; }

        // check duplicate
        const users = readUsers();
        if (users.find(u => u.email === email)) { msg.textContent = 'An account with this email already exists.'; return; }

        // hash and store
        try {
          const hash = await hashPassword(pw);
          const newUser = { name, email, passwordHash: hash, createdAt: new Date().toISOString() };
          users.push(newUser);
          saveUsers(users);
          // set auth and redirect to index
          setAuth({ name: newUser.name, email: newUser.email });
          msg.style.color = '#bfffe6';
          msg.textContent = 'Account created — redirecting to home...';
          setTimeout(()=> window.location.href = 'index.html', 900);
        } catch (err) {
          console.error(err);
          msg.textContent = 'Could not create account (error).';
        }
      });
    }

    // Login page
    const loginForm = $('#login-form');
    if (loginForm) {
      const msg = $('#login-message');
      loginForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const email = (document.getElementById('login-email')||{}).value.trim().toLowerCase();
        const pw = (document.getElementById('login-password')||{}).value;
        msg.textContent = '';
        if (!email || !pw) { msg.textContent = 'Provide email and password.'; return; }

        const users = readUsers();
        const user = users.find(u => u.email === email);
        if (!user) { msg.textContent = 'No account found with that email.'; return; }

        try {
          const hash = await hashPassword(pw);
          if (hash === user.passwordHash) {
            setAuth({ name: user.name, email: user.email });
            msg.style.color = '#bfffe6';
            msg.textContent = 'Logged in — redirecting to home...';
            setTimeout(()=> window.location.href = 'index.html', 700);
          } else {
            msg.textContent = 'Incorrect password.';
          }
        } catch (err) {
          console.error(err);
          msg.textContent = 'Login failed (error).';
        }
      });
    }

    // If on index page, optionally show "welcome back" or small dashboard interactions
    // (renderAuthInNavbar already called at top)
  })();

}); // end DOMContentLoaded
/* ---------- End of main.js ---------- */