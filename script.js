/* =======================================================
   GLISSON TREE SERVICE — SHARED SCRIPT
   ======================================================= */

// ── Announcement Bar ──
const annBar = document.querySelector('.ann-bar');
const annDismiss = document.querySelector('.ann-bar-dismiss');
const nav = document.querySelector('.nav');
if (annBar && !sessionStorage.getItem('ann-dismissed')) {
  nav?.classList.add('ann-visible');
}
annDismiss?.addEventListener('click', () => {
  annBar.classList.add('hidden');
  nav?.classList.remove('ann-visible');
  sessionStorage.setItem('ann-dismissed', '1');
});

// ── Navigation scroll ──
const hasHero = !!document.querySelector('.hero');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60 || !hasHero) {
    nav?.classList.add('scrolled');
  } else {
    nav?.classList.remove('scrolled');
  }
});
if (!hasHero) nav?.classList.add('scrolled');

// ── Mobile Menu ──
const hamburger  = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileClose = document.querySelector('.mobile-menu-close');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
  document.body.style.overflow = mobileMenu?.classList.contains('open') ? 'hidden' : '';
});
mobileClose?.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-menu a').forEach(l => l.addEventListener('click', closeMenu));
function closeMenu() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Hero Background Parallax-on-load ──
const heroBg = document.querySelector('.hero-bg');
if (heroBg) setTimeout(() => heroBg.classList.add('loaded'), 80);

// ── Scroll Reveal ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// ── Active Nav Link ──
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ── Stats Counter Animation ──
function animateCount(el, target, suffix) {
  const duration = 2000;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + (suffix || '');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const numEl = e.target.querySelector('.stat-count');
      if (numEl) {
        const target = parseInt(numEl.dataset.target, 10);
        // suffix is rendered by a sibling .stat-suffix span — animate count only
        animateCount(numEl, target, '');
      }
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-card').forEach(el => statsObserver.observe(el));

// ── FAQ Accordion ──
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── Gallery Filter Tabs ──
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    document.querySelectorAll('.gallery-page-item').forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.style.display = '';
        item.style.animation = 'msg-in 0.4s ease';
      } else {
        item.style.display = 'none';
      }
    });
  });
});

// ── Form Validation + Submission ──
function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    const empty = !field.value.trim();
    field.style.borderColor = empty ? '#dc2626' : '';
    field.style.boxShadow  = empty ? '0 0 0 3px rgba(220,38,38,0.12)' : '';
    if (empty) {
      valid = false;
      field.addEventListener('input', () => {
        field.style.borderColor = '';
        field.style.boxShadow  = '';
      }, { once: true });
    }
  });
  if (!valid) {
    const first = [...form.querySelectorAll('[required]')].find(f => !f.value.trim());
    first?.focus();
  }
  return valid;
}

document.querySelectorAll('form.quote-form, form.contact-form-main').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const btn = form.querySelector('button[type="submit"]');
    const successEl = form.closest('.form-wrapper, .contact-form, .contact-form-card')
                          ?.querySelector('.form-success');
    const origText = btn.innerHTML;
    btn.innerHTML = 'Sending…';
    btn.disabled = true;

    try {
      // FORMSUBMIT INTEGRATION POINT — change action attr on <form> to:
      // action="https://formsubmit.co/YOUR_EMAIL" method="POST"
      await new Promise(r => setTimeout(r, 1400));
      form.style.display = 'none';
      if (successEl) successEl.classList.add('show');
      else { btn.innerHTML = '✓ Request Sent!'; btn.style.background = 'var(--forest)'; }
    } catch {
      btn.innerHTML = 'Error — Try Again';
      btn.disabled = false;
      setTimeout(() => { btn.innerHTML = origText; }, 3000);
    }
  });
});

// ── Smooth Scroll for Anchors ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') { e.preventDefault(); return; }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ═══════════════════════════════════════════════════════
//  CHATBOT WIDGET
// ═══════════════════════════════════════════════════════

const chatBtn    = document.querySelector('.chatbot-btn');
const chatWindow = document.querySelector('.chatbot-window');
const chatMsgs   = document.querySelector('.chatbot-messages');
const chatTyping = document.querySelector('.chat-typing');
const chatChips  = document.querySelector('.chat-chips');
const chatInput  = document.querySelector('.chatbot-input');
const chatSend   = document.querySelector('.chatbot-send');
const chatLeadForm = document.querySelector('.chatbot-lead-form');

if (!chatBtn) { /* chatbot not on page */ }
else {

// Knowledge base
const KB = {
  greeting: [
    "Hi there! 👋 I'm the Glisson Tree Service virtual assistant. How can I help you today?",
    "Welcome! I can answer questions about our services, pricing, or help you schedule a free estimate."
  ],
  services: "We offer **Tree Removal**, **Tree Trimming & Pruning**, **Stump Grinding**, **Emergency Tree Service**, and **Lot & Land Clearing**. Which service can I help you with?",
  removal: "🌳 **Tree Removal** — We safely remove trees of all sizes using professional equipment. We handle everything from small ornamental trees to large oaks and pines. Pricing depends on tree size, location, and accessibility. We offer **free estimates** — just give us a call at **(478) 258-8169** or submit a request below!",
  trimming: "✂️ **Tree Trimming & Pruning** — Regular trimming keeps your trees healthy and your property safe. We trim and prune all tree species. Most trees benefit from trimming every 2–4 years. Want a free quote?",
  emergency: "🚨 **Emergency Service** — Yes! We provide **24/7 emergency tree service** for storm damage, fallen trees, and hazardous situations. For emergencies, **call us immediately at (478) 258-8169**. We respond fast to protect your property.",
  stump: "🪵 **Stump Grinding** — We grind stumps down below grade so you can replant or landscape over them. Pricing is based on stump diameter. Most residential stumps are very affordable. Get a **free estimate** today!",
  clearing: "🚜 **Lot & Land Clearing** — We clear trees, brush, and debris from residential and commercial lots. Perfect if you're building, developing, or just reclaiming your land. We handle jobs of all sizes across Middle Georgia.",
  insurance: "✅ Yes, Glisson Tree Service is **fully licensed and insured**. You're fully protected on every job we perform.",
  price: "💰 Pricing depends on the service, tree size, and job complexity. The best way to get an accurate price is a **free on-site estimate** — no pressure, no obligation. Call us at **(478) 258-8169** or submit your info and we'll come to you!",
  estimate: "📋 All our estimates are completely **free** with no obligation. We'll come to your property, assess the job, and give you a fair price. Want to schedule one? I can collect your info right now!",
  areas: "📍 We serve **Macon, Warner Robins, Perry, Forsyth, Byron, Centerville**, Jones County, Bibb County, Houston County, Monroe County, and surrounding Middle Georgia communities.",
  hours: "🕐 Our normal hours are **Monday–Friday, 6 AM – 9 PM**. For emergencies, we're available **24/7** — call **(478) 258-8169** any time.",
  safety: "🦺 Safety is our top priority. Our crew uses professional equipment, follows ANSI tree care standards, and maintains full liability insurance. Your property and family are protected on every job.",
  storm: "⛈️ **Storm Damage** — After a storm, call us immediately at **(478) 258-8169**. We respond quickly to remove fallen or dangerous trees from your property. We offer **24/7 emergency response**.",
  fallback: "That's a great question! For specific details, the best step is to call us at **(478) 258-8169** or request a free estimate. Our team will get you the answers you need right away.",
};

function keywords(input) {
  const t = input.toLowerCase();
  if (/\b(emergency|urgent|fell|fallen|storm|damage|dangerous|hazard|24.7|asap|right now)\b/.test(t)) return 'emergency';
  if (/\b(remov|cut down|take down|cut.*tree)\b/.test(t)) return 'removal';
  if (/\b(trim|prune|pruning|trimming|shape)\b/.test(t)) return 'trimming';
  if (/\b(stump|grinding|grind)\b/.test(t)) return 'stump';
  if (/\b(clear|clearing|lot|land|acreage|acres|brush)\b/.test(t)) return 'clearing';
  if (/\b(price|cost|how much|charge|rate|estimate|quote)\b/.test(t)) return 'price';
  if (/\b(insur|licens|certif)\b/.test(t)) return 'insurance';
  if (/\b(area|serv|where|location|travel|come to)\b/.test(t)) return 'areas';
  if (/\b(hour|open|available|when)\b/.test(t)) return 'hours';
  if (/\b(safe|safet|equipment)\b/.test(t)) return 'safety';
  if (/\b(service|what do|offer|provide)\b/.test(t)) return 'services';
  return null;
}

let leadStage = 0; // 0=chat, 1=collecting
let chatOpen  = false;

function openChat() {
  chatOpen = true;
  chatBtn.classList.add('open');
  chatBtn.innerHTML = '✕';
  chatWindow.classList.add('open');
  if (chatMsgs.children.length === 1 && chatMsgs.querySelector('.chat-typing')) {
    showBotMessages(KB.greeting, true);
  }
}
function closeChat() {
  chatOpen = false;
  chatBtn.classList.remove('open');
  chatBtn.innerHTML = '🌳';
  chatWindow.classList.remove('open');
}
chatBtn.addEventListener('click', () => chatOpen ? closeChat() : openChat());

function addMsg(text, type) {
  if (chatMsgs.querySelector('.chat-typing')) chatTyping.classList.remove('show');
  const el = document.createElement('div');
  el.className = `chat-msg ${type}`;
  el.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
  chatMsgs.appendChild(el);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

async function showBotMessages(msgs, withChips) {
  chatTyping.classList.add('show');
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  const arr = Array.isArray(msgs) ? msgs : [msgs];
  for (let i = 0; i < arr.length; i++) {
    await new Promise(r => setTimeout(r, 900 + i * 400));
    addMsg(arr[i], 'bot');
  }
  chatTyping.classList.remove('show');
  if (withChips) setChips(['Tree Removal','Tree Trimming','Emergency','Stump Grinding','Get a Quote']);
}

function setChips(options) {
  chatChips.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.className = 'chat-chip';
    chip.textContent = opt;
    chip.addEventListener('click', () => {
      chatChips.innerHTML = '';
      addMsg(opt, 'user');
      handleUserMessage(opt.toLowerCase());
    });
    chatChips.appendChild(chip);
  });
}

function handleUserMessage(text) {
  if (leadStage === 1) return; // handled by lead form
  const key = keywords(text);

  if (/\b(yes|yeah|sure|ok|let|schedule|estimate|quote|contact|reach)\b/.test(text) && !key) {
    showLeadCapture();
    return;
  }

  let response = key ? KB[key] : KB.fallback;
  const followUp = "Would you like to **schedule a free estimate**? I can collect your info right now, or you can call us directly at **(478) 258-8169**.";

  showBotMessages([response, followUp], false).then(() => {
    setChips(['Yes, schedule estimate','Call (478) 258-8169','Other question']);
  });
}

function showLeadCapture() {
  leadStage = 1;
  addMsg("Great! I'll collect your info and our team will reach out to schedule your free estimate. 📋", 'bot');
  chatChips.innerHTML = '';
  chatLeadForm.style.display = 'block';
}

chatSend?.addEventListener('click', sendMessage);
chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  chatChips.innerHTML = '';
  addMsg(text, 'user');
  handleUserMessage(text.toLowerCase());
}

// Lead form submit
const leadSubmit = document.querySelector('.chatbot-lead-form .btn');
leadSubmit?.addEventListener('click', () => {
  const nameEl  = document.querySelector('.chatbot-lead-form [name="chat-name"]');
  const phoneEl = document.querySelector('.chatbot-lead-form [name="chat-phone"]');
  const serviceEl = document.querySelector('.chatbot-lead-form [name="chat-service"]');
  if (!nameEl.value.trim() || !phoneEl.value.trim()) {
    nameEl.style.borderColor  = nameEl.value.trim() ? '' : '#dc2626';
    phoneEl.style.borderColor = phoneEl.value.trim() ? '' : '#dc2626';
    return;
  }
  chatLeadForm.style.display = 'none';
  leadStage = 0;
  addMsg(`Thanks, **${nameEl.value}**! 🎉 We'll call you at ${phoneEl.value} within 1 business hour to schedule your free estimate. Talk soon!`, 'bot');
  setChips(['Thanks!','One more question']);
});

} // end chatbot block

// ── Reviews Slider ──
(function () {
  const track    = document.getElementById('reviewsTrack');
  const prevBtn  = document.getElementById('reviewsPrev');
  const nextBtn  = document.getElementById('reviewsNext');
  const dotsWrap = document.getElementById('reviewsDots');
  if (!track) return;

  const cards = [...track.querySelectorAll('.testimonial-card')];
  let current = 0;
  let autoTimer;

  function getPerPage() {
    if (window.innerWidth <= 580) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function totalSlides() { return Math.ceil(cards.length / getPerPage()); }

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const d = document.createElement('button');
      d.className = 'slider-dot' + (i === current ? ' active' : '');
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function goTo(index) {
    const pp     = getPerPage();
    const max    = totalSlides() - 1;
    current      = Math.max(0, Math.min(index, max));
    const gap    = parseFloat(getComputedStyle(track).gap) || 28;
    const cardW  = cards[0].offsetWidth;
    const offset = current * (cardW * pp + gap * pp);
    track.style.transform = `translateX(-${offset}px)`;
    dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current >= max;
    resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current >= totalSlides() - 1 ? 0 : current + 1), 5000);
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  // Pause on hover
  track.closest('.reviews-slider-wrap')?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.closest('.reviews-slider-wrap')?.addEventListener('mouseleave', resetAuto);

  // Touch/swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Re-init on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildDots(); goTo(0); }, 200);
  });

  buildDots();
  goTo(0);
})();

// ── Lightbox for Gallery Page ──
document.querySelectorAll('.gallery-page-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (!img) return;
    const lb = document.createElement('div');
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    const imgClone = img.cloneNode();
    imgClone.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;';
    lb.appendChild(imgClone);
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
  });
});
