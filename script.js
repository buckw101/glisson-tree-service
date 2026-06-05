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
      const fd = new FormData(form);
      const obj = Object.fromEntries(fd.entries());
      const lead = {
        name:    obj.name    || obj['full-name'] || '',
        phone:   obj.phone   || '',
        email:   obj.email   || '',
        service: obj.service || obj.situation || '',
        message: obj.details || obj.message || obj.description || '',
        source:  'Website Form',
        stage:   'new',
      };

      // Insert into Supabase
      await fetch('https://mlpwadopeqisrgflqwbi.supabase.co/rest/v1/glisson_leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_YQO_ZljWCubOqvMpHylkFw_hnnmPPsA',
          'Authorization': 'Bearer sb_publishable_YQO_ZljWCubOqvMpHylkFw_hnnmPPsA',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(lead)
      });

      // Also send email via FormSubmit
      fetch('https://formsubmit.co/ajax/codyleeglisson94@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      });

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
