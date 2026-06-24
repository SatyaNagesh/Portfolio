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
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  /* Close nav on link click */
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
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

    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

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

  /* --- Project Cards Injection & Filtering --- */
  const projectsGrid = document.getElementById('projectsGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let currentFilter = 'all';

  function renderProjects(filter) {
    let filtered;
    if (filter === 'all') {
      filtered = [...projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (filter === 'featured') {
      filtered = projects.filter(p => p.featured);
    } else {
      filtered = projects.filter(p => p.category === filter);
    }

    projectsGrid.innerHTML = filtered.map((project, i) => `
      <div class="project-card${project.featured ? ' featured' : ''}" data-category="${project.category}" style="transition-delay: ${i * 50}ms">
        <div class="project-card-inner">
          ${project.featured ? '<div class="project-featured-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Main Achievement</div>' : ''}
          <div class="project-category">${categoryLabels[project.category] || project.category}</div>
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <div class="project-tech">
            ${project.tech.map(t => `<span>${t}</span>`).join('')}
          </div>
          <div class="project-links">
            <a href="${project.github}" target="_blank" rel="noopener" class="project-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Source Code
            </a>
            <a href="${project.demo}" target="_blank" rel="noopener" class="project-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Live Demo
            </a>
          </div>
        </div>
      </div>
    `).join('');

    /* Animate cards in after filter */
    requestAnimationFrame(() => {
      const cards = projectsGrid.querySelectorAll('.project-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProjects(currentFilter);
    });
  });

  renderProjects('all');

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
    initBorderGlow('.skill-category', { colors: ['#444', '#777', '#aaa'] });
    initBorderGlow('.project-card', { colors: ['#444', '#777', '#aaa'] });
    initBorderGlow('.about-card', { colors: ['#444', '#777', '#aaa'] });
    initBorderGlow('.contact-card', { colors: ['#444', '#777', '#aaa'] });
  }
  setTimeout(applyGlowToCards, 100);

  /* Re-apply glow when project cards are re-rendered */
  const origRender = renderProjects;
  renderProjects = function(filter) {
    origRender(filter);
    setTimeout(() => initBorderGlow('.project-card', { colors: ['#444', '#777', '#aaa'] }), 200);
  };
});
