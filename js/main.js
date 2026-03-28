// Splash screen + page entrance
const splash = document.getElementById('splash');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducedMotion) {
  splash.remove();
  document.body.classList.remove('loading');
  runSlotAnimations();
} else {
  setTimeout(() => {
    splash.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      splash.remove();
      document.body.classList.remove('loading');
      setTimeout(runSlotAnimations, 350);
    }, 650);
  }, 1050);
}

// Scramble number animation
function runSlotAnimations() {
  document.querySelectorAll('.stat-num[data-count]').forEach((el, elIndex) => {
    const target = el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const digits = target.split('');

    if (reducedMotion) {
      el.textContent = target + suffix;
      el.style.opacity = '1';
      return;
    }

    // Set content before revealing to prevent layout shift
    el.textContent = digits.map(() => '0').join('') + suffix;

    setTimeout(() => {
      el.style.opacity = '1';

      const duration = 550;
      const interval = 45;
      const totalSteps = Math.round(duration / interval);
      let step = 0;

      const tick = setInterval(() => {
        step++;
        const progress = step / totalSteps;
        const scrambled = digits.map((ch, i) => {
          return progress >= (i + 1) / digits.length ? ch : Math.floor(Math.random() * 10);
        }).join('');
        el.textContent = scrambled + suffix;

        if (step >= totalSteps) {
          clearInterval(tick);
          el.textContent = target + suffix;
        }
      }, interval);
    }, elIndex * 150);
  });
}

// Hamburger menu
const hamburger = document.querySelector('.nav-hamburger');
const navLinksList = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  const open = navLinksList.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinksList.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinksList.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Scroll to top
const scrollTopBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Scroll reveal with position-based stagger
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const siblings = Array.from(entry.target.parentElement.children);
      const idx = siblings.indexOf(entry.target);
      const delay = Math.min(idx, 6) * 60;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => observer.observe(el));

// Scroll progress bar
const progressBar = document.getElementById('progress-bar');
let rafPending = false;
window.addEventListener('scroll', () => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (window.scrollY / total * 100) + '%';
    rafPending = false;
  });
}, { passive: true });

// Active nav highlighting
const sections = document.querySelectorAll('section[id]');
const navLinkItems = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinkItems.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectionObserver.observe(s));



// Typing effect
const phrases = ['FPGA Systems', 'Embedded Hardware', 'Autonomous Robots', 'Analog Circuits', 'CPU Architecture'];
let pi = 0, ci = 0, deleting = false;
const typedEl = document.getElementById('typed-text');
function type() {
  const phrase = phrases[pi];
  typedEl.textContent = deleting ? phrase.slice(0, ci--) : phrase.slice(0, ci++);
  if (!deleting && ci > phrase.length) { deleting = true; setTimeout(type, 1400); return; }
  if (deleting && ci < 0) { deleting = false; pi = (pi + 1) % phrases.length; ci = 0; }
  setTimeout(type, deleting ? 40 : 85);
}
type();
