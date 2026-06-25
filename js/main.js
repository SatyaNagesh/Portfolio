/* ========================================
   SATYA NAGESH — Portfolio Main JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Cursor Glow --- */
  const cursorGlow = document.getElementById('cursorGlow');
  let cursorX = -200, cursorY = -200;
  let glowX = -200, glowY = -200;

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  });

  function animateGlow() {
    glowX += (cursorX - glowX) * 0.08;
    glowY += (cursorY - glowY) * 0.08;
    cursorGlow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  /* --- Mobile Nav Toggle --- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const gooeyWrap = document.querySelector('.gooey-nav-wrap');
      if (gooeyWrap) {
        const isOpen = gooeyWrap.classList.toggle('open');
        navToggle.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
      }
    });
  }

  /* Close nav on link click */
  document.querySelectorAll('.gooey-nav ul li a').forEach(link => {
    link.addEventListener('click', () => {
      const gooeyWrap = document.querySelector('.gooey-nav-wrap');
      if (gooeyWrap) gooeyWrap.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* --- Navigation Scroll Spy --- */
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('.section[id]');
  const navAnchors = document.querySelectorAll('.nav-link');

  function updateNav() {
    let current = 'hero';
    sections.forEach(section => {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navAnchors.forEach(anchor => {
      anchor.classList.remove('active');
      if (anchor.getAttribute('href') === `#${current}`) {
        anchor.classList.add('active');
      }
    });

    const activeLi = document.querySelector(`.gooey-nav ul li a[href="#${current}"]`)?.closest('li');
    if (activeLi) {
      const idx = Array.from(document.querySelectorAll('.gooey-nav ul li')).indexOf(activeLi);
      if (idx >= 0 && gooeyNavWrap) {
        gooeyNavWrap._gooeySetActive(idx);
      }
    }

    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* --- GooeyNav --- */
  const navUl = document.getElementById('navLinks');
  let gooeyNavWrap = null;
  if (navUl) {
    gooeyNavWrap = initGooeyNav(navUl.parentElement, {
      onActiveChange: (index) => {
        const lis = navUl.querySelectorAll('li');
        const link = lis[index]?.querySelector('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href?.startsWith('#')) {
            navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
          }
        }
      }
    });

    navUl.querySelectorAll('li a').forEach(a => {
      a.addEventListener('click', () => {
        const gw = document.querySelector('.gooey-nav-wrap');
        if (gw) gw.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Reveal Animation on Scroll --- */
  const revealElements = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* --- Dome Gallery for Projects --- */
  const domeGallery = initProjectDome(projects);

  /* --- BorderGlow Effect (vanilla) --- */
  function initBorderGlow(selector, options = {}) {
    const config = {
      glowColor: '0 0 65',
      glowIntensity: 1.0,
      coneSpread: 25,
      colors: ['#555', '#888', '#bbb'],
      fillOpacity: 0.35,
      ...options
    };

    document.querySelectorAll(selector).forEach(el => {
      if (el._glowInitialized) return;
      el._glowInitialized = true;

      const wrapper = document.createElement('div');
      wrapper.className = 'glow-card-wrapper';
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);

      const cardBg = getComputedStyle(el).backgroundColor;
      wrapper.style.setProperty('--card-bg', cardBg || '#1A1A1A');

      const { h, s, l } = (() => {
        const m = config.glowColor.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
        return m ? { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) } : { h: 0, s: 0, l: 65 };
      })();
      const base = `${h}deg ${s}% ${l}%`;
      const opacities = [100, 60, 50, 40, 30, 20, 10];
      const suffixes = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
      for (let i = 0; i < opacities.length; i++) {
        wrapper.style.setProperty(`--glow-color${suffixes[i]}`, `hsl(${base} / ${Math.min(opacities[i] * config.glowIntensity, 100)}%)`);
      }

      const positions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
      const gKeys = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
      const colorMap = [0, 1, 2, 0, 1, 2, 1];
      for (let i = 0; i < 7; i++) {
        const c = config.colors[Math.min(colorMap[i], config.colors.length - 1)];
        wrapper.style.setProperty(`--gradient-${gKeys[i]}`, `radial-gradient(at ${positions[i]}, ${c} 0px, transparent 50%)`);
      }

      const edgeLight = document.createElement('span');
      edgeLight.className = 'edge-light';
      wrapper.appendChild(edgeLight);

      wrapper.addEventListener('pointermove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        let kx = 1 / 0, ky = 1 / 0;
        if (dx !== 0) kx = cx / Math.abs(dx);
        if (dy !== 0) ky = cy / Math.abs(dy);
        const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
        let degrees = 0;
        if (dx !== 0 || dy !== 0) {
          degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          if (degrees < 0) degrees += 360;
        }
        wrapper.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
        wrapper.style.setProperty('--cursor-angle', `${degrees.toFixed(3)}deg`);
      });
    });
  }

  /* Apply BorderGlow to cards */
  function applyGlowToCards() {
    initBorderGlow('.skill-category', { colors: ['#c084fc', '#f472b6', '#38bdf8'] });
    initBorderGlow('.about-card', { colors: ['#c084fc', '#f472b6', '#38bdf8'] });
    initBorderGlow('.contact-card', { colors: ['#c084fc', '#f472b6', '#38bdf8'] });
  }
  setTimeout(applyGlowToCards, 100);
});
