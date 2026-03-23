function launchHearts() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const count = 45;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const h = document.createElement('span');
      h.className = 'sparkle-heart';
      h.textContent = '♥';

      const startX = Math.random() * vw;
      const startY = vh * 0.35 + Math.random() * vh * 0.65;
      const sx     = (Math.random() - 0.5) * 220;
      const ty     = -(vh * (0.55 + Math.random() * 0.5));
      const dur    = (1.8 + Math.random() * 1.6).toFixed(2);
      const size   = (28 + Math.random() * 42).toFixed(0);

      h.style.left = startX + 'px';
      h.style.top  = startY + 'px';
      h.style.setProperty('--sx',  sx  + 'px');
      h.style.setProperty('--ty',  ty  + 'px');
      h.style.setProperty('--dur', dur + 's');
      h.style.fontSize = size + 'px';

      document.body.appendChild(h);
      setTimeout(() => h.remove(), (parseFloat(dur) + 0.2) * 1000);
    }, i * 55);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Navbar scroll effect ---
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  // --- Mobile hamburger ---
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    hamburger.innerHTML = open
      ? '<span></span><span></span><span></span>'
      : '<span></span><span></span><span></span>';
    hamburger.classList.toggle('is-open', open);
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('is-open');
    });
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Menu category tabs ---
  const catBtns = document.querySelectorAll('.cat-btn');
  const catPanels = document.querySelectorAll('.menu-panel');
  catBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      catBtns.forEach((b) => b.classList.remove('active'));
      catPanels.forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`panel-${btn.dataset.cat}`);
      if (panel) panel.classList.add('active');
    });
  });

  // --- Reservation form ---
  const form = document.getElementById('reservation-form');
  const submitBtn = document.getElementById('submit-btn');
  const successMsg = document.getElementById('form-success');
  const errorMsg = document.getElementById('form-error');

  // Set minimum date to today
  const dateInput = document.getElementById('res-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      successMsg.style.display = 'none';
      errorMsg.style.display = 'none';

      const lang = document.getElementById('form-lang')?.value || 'es';

      const payload = {
        name:   form.querySelector('#res-name').value.trim(),
        email:  form.querySelector('#res-email').value.trim(),
        phone:  form.querySelector('#res-phone').value.trim(),
        date:   form.querySelector('#res-date').value,
        time:   form.querySelector('#res-time').value,
        guests: form.querySelector('#res-guests').value,
        notes:  form.querySelector('#res-notes').value.trim(),
        lang,
      };

      // Simple client-side validation
      if (!payload.name || !payload.email || !payload.date || !payload.time || !payload.guests) {
        return;
      }

      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.setAttribute('data-i18n', 'reservations.sending');
      // Apply translation if available
      const sendingKey = 'reservations.sending';
      if (window.__i18nStrings && window.__i18nStrings[sendingKey]) {
        submitBtn.textContent = window.__i18nStrings[sendingKey];
      } else {
        submitBtn.textContent = '...';
      }

      try {
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          form.reset();
          successMsg.style.display = 'block';
          successMsg.classList.remove('animate');
          void successMsg.offsetWidth; // restart animation
          successMsg.classList.add('animate');
          launchHearts();
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          throw new Error('Server error');
        }
      } catch {
        errorMsg.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // --- Intersection Observer for fade-in animations ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

  // --- Parallax on hero ---
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    }, { passive: true });
  }
});
