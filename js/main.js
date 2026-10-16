(() => {
  // Mobile navigation
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state if the viewport grows past the mobile breakpoint
    const desktop = window.matchMedia('(min-width: 861px)');
    const onBreakpoint = (e) => { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  // Highlight the nav link for the section currently in view
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map();
    navLinks.forEach((link) => byId.set(link.getAttribute('href').slice(1), link));

    // Sections without a nav link (e.g. About) clear the highlight
    const setCurrent = (id) => {
      navLinks.forEach((l) => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
      });
      const link = byId.get(id);
      if (link) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'location');
      }
    };

    // The last section is too short to reach the band below, so it wins while the footer is visible
    const footer = document.querySelector('.site-footer');
    const last = document.querySelector('main section[id]:last-of-type');
    let atEnd = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !atEnd) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('main section[id]').forEach((s) => observer.observe(s));

    if (footer && last) {
      new IntersectionObserver((entries) => {
        atEnd = entries[0].isIntersecting;
        if (atEnd) setCurrent(last.id);
      }).observe(footer);
    }
  }
})();
