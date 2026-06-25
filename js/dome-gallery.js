/* ========================================
   DomeGallery — Vanilla JS (ported from React Bits)
   ======================================== */

function buildDomeItems(pool, seg) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];
  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });
  const totalSlots = coords.length;
  if (!pool.length) return coords.map(c => ({ ...c, src: '', alt: '' }));
  const normalized = pool.map(p => (typeof p === 'string' ? { src: p, alt: '' } : { src: p.src || '', alt: p.alt || '' }));
  const used = Array.from({ length: totalSlots }, (_, i) => normalized[i % normalized.length]);
  for (let i = 1; i < used.length; i++) {
    if (used[i].src === used[i - 1].src) {
      for (let j = i + 1; j < used.length; j++) {
        if (used[j].src !== used[i].src) { const t = used[i]; used[i] = used[j]; used[j] = t; break; }
      }
    }
  }
  return coords.map((c, i) => ({ ...c, src: used[i].src, alt: used[i].alt }));
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = deg => { const a = (((deg + 180) % 360) + 360) % 360; return a - 180; };

function DomeGallery(container, options = {}) {
  const cfg = {
    fit: 0.5,
    fitBasis: 'auto',
    minRadius: 500,
    maxRadius: Infinity,
    padFactor: 0.25,
    overlayBlurColor: '#0A0A0A',
    maxVerticalRotationDeg: 20,
    dragSensitivity: 20,
    enlargeTransitionMs: 300,
    segments: 35,
    dragDampening: 3.6,
    openedImageWidth: '420px',
    openedImageHeight: '320px',
    imageBorderRadius: '16px',
    openedImageBorderRadius: '20px',
    grayscale: true,
    items: [],
    onItemClick: null,
    ...options
  };

  const state = {
    rotation: { x: 0, y: 0 },
    startRot: { x: 0, y: 0 },
    startPos: null,
    dragging: false,
    moved: false,
    opening: false,
    openStartedAt: 0,
    lastDragEndAt: 0,
    focusedItem: null,
    originalTilePos: null,
    inertiaRAF: null,
    lockedRadius: null
  };

  let root, mainEl, sphereEl, viewerEl, scrimEl, frameEl;

  function build() {
    container.innerHTML = '';
    container.classList.add('sphere-root');
    container.style.setProperty('--overlay-blur-color', cfg.overlayBlurColor);
    container.style.setProperty('--tile-radius', cfg.imageBorderRadius);
    container.style.setProperty('--enlarge-radius', cfg.openedImageBorderRadius);

    mainEl = document.createElement('main');
    mainEl.className = 'sphere-main';

    const stage = document.createElement('div');
    stage.className = 'stage';

    sphereEl = document.createElement('div');
    sphereEl.className = 'sphere';

    const domeItems = buildDomeItems(cfg.items, cfg.segments);
    domeItems.forEach((it, i) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item';
      itemDiv.dataset.src = it.src;
      itemDiv.dataset.offsetX = it.x;
      itemDiv.dataset.offsetY = it.y;
      itemDiv.dataset.sizeX = it.sizeX;
      itemDiv.dataset.sizeY = it.sizeY;
      itemDiv.dataset.index = i;
      itemDiv.style.setProperty('--offset-x', it.x);
      itemDiv.style.setProperty('--offset-y', it.y);
      itemDiv.style.setProperty('--item-size-x', it.sizeX);
      itemDiv.style.setProperty('--item-size-y', it.sizeY);

      const imgDiv = document.createElement('div');
      imgDiv.className = 'item__image';
      imgDiv.setAttribute('role', 'button');
      imgDiv.tabIndex = 0;

      const img = document.createElement('img');
      if (it.src) {
        img.src = it.src;
      } else {
        const grad = getProjectGradient(i);
        imgDiv.style.background = grad;
        img.style.display = 'none';
        const label = document.createElement('span');
        label.className = 'item__label';
        label.textContent = it.alt || '';
        imgDiv.appendChild(label);
      }
      img.draggable = false;
      img.alt = it.alt;
      imgDiv.appendChild(img);

      imgDiv.addEventListener('click', onTileClick);
      imgDiv.addEventListener('pointerup', onTilePointerUp);
      itemDiv.appendChild(imgDiv);
      sphereEl.appendChild(itemDiv);
    });

    stage.appendChild(sphereEl);
    mainEl.appendChild(stage);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    mainEl.appendChild(overlay);

    const overlayBlur = document.createElement('div');
    overlayBlur.className = 'overlay overlay--blur';
    mainEl.appendChild(overlayBlur);

    const fadeTop = document.createElement('div');
    fadeTop.className = 'edge-fade edge-fade--top';
    mainEl.appendChild(fadeTop);

    const fadeBottom = document.createElement('div');
    fadeBottom.className = 'edge-fade edge-fade--bottom';
    mainEl.appendChild(fadeBottom);

    viewerEl = document.createElement('div');
    viewerEl.className = 'viewer';

    scrimEl = document.createElement('div');
    scrimEl.className = 'scrim';
    viewerEl.appendChild(scrimEl);

    frameEl = document.createElement('div');
    frameEl.className = 'frame';
    viewerEl.appendChild(frameEl);

    mainEl.appendChild(viewerEl);
    container.appendChild(mainEl);

    root = container;
  }

  function getProjectGradient(index) {
    const grads = [
      'linear-gradient(135deg, #1a1a2e, #16213e)',
      'linear-gradient(135deg, #0f0c29, #302b63)',
      'linear-gradient(135deg, #111, #333)',
      'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
      'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
      'linear-gradient(135deg, #1c1c1c, #383838)',
      'linear-gradient(135deg, #0d0d0d, #262626)',
      'linear-gradient(135deg, #151515, #2d2d2d)',
      'linear-gradient(135deg, #080808, #222)',
      'linear-gradient(135deg, #121212, #303030)',
      'linear-gradient(135deg, #1e1e1e, #3a3a3a)',
      'linear-gradient(135deg, #050505, #1f1f1f)',
      'linear-gradient(135deg, #181818, #353535)',
      'linear-gradient(135deg, #0c0c0c, #282828)',
      'linear-gradient(135deg, #141414, #313131)',
      'linear-gradient(135deg, #101010, #2b2b2b)',
    ];
    return grads[index % grads.length];
  }

  function applyTransform(xDeg, yDeg) {
    if (sphereEl) {
      sphereEl.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  }

  function stopInertia() {
    if (state.inertiaRAF) { cancelAnimationFrame(state.inertiaRAF); state.inertiaRAF = null; }
  }

  function startInertia(vx, vy) {
    const MAX_V = 1.4;
    let vX = clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = clamp(vy, -MAX_V, MAX_V) * 80;
    let frames = 0;
    const d = clamp(cfg.dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);

    function step() {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) { state.inertiaRAF = null; return; }
      if (++frames > maxFrames) { state.inertiaRAF = null; return; }
      const nextX = clamp(state.rotation.x - vY / 200, -cfg.maxVerticalRotationDeg, cfg.maxVerticalRotationDeg);
      const nextY = wrapAngleSigned(state.rotation.y + vX / 200);
      state.rotation = { x: nextX, y: nextY };
      applyTransform(nextX, nextY);
      state.inertiaRAF = requestAnimationFrame(step);
    }
    stopInertia();
    state.inertiaRAF = requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    if (state.focusedItem) return;
    stopInertia();
    state.dragging = true;
    state.moved = false;
    state.startRot = { ...state.rotation };
    state.startPos = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e) {
    if (state.focusedItem || !state.dragging || !state.startPos) return;
    const dxTotal = e.clientX - state.startPos.x;
    const dyTotal = e.clientY - state.startPos.y;
    if (!state.moved) {
      if (dxTotal * dxTotal + dyTotal * dyTotal > 16) state.moved = true;
    }
    const nextX = clamp(state.startRot.x - dyTotal / cfg.dragSensitivity, -cfg.maxVerticalRotationDeg, cfg.maxVerticalRotationDeg);
    const nextY = wrapAngleSigned(state.startRot.y + dxTotal / cfg.dragSensitivity);
    state.rotation = { x: nextX, y: nextY };
    applyTransform(nextX, nextY);
  }

  function onPointerUp(e) {
    if (!state.dragging) return;
    state.dragging = false;
    if (state.moved) {
      state.lastDragEndAt = performance.now();
      const dt = 50;
      const dx = e.clientX - state.startPos.x;
      const dy = e.clientY - state.startPos.y;
      const vx = dx / dt * 0.02;
      const vy = dy / dt * 0.02;
      if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
    }
    state.moved = false;
  }

  function onTileClick(e) {
    if (state.dragging || state.moved) return;
    if (performance.now() - state.lastDragEndAt < 80) return;
    if (state.opening) return;
    openItem(e.currentTarget);
  }

  function onTilePointerUp(e) {
    if (e.pointerType !== 'touch') return;
    if (state.dragging || state.moved) return;
    if (performance.now() - state.lastDragEndAt < 80) return;
    if (state.opening) return;
    openItem(e.currentTarget);
  }

  function getDataNumber(el, name, fallback) {
    const n = parseFloat(el.dataset[name]);
    return Number.isFinite(n) ? n : fallback;
  }

  function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
    const unit = 360 / segments / 2;
    return { rotateX: unit * (offsetY - (sizeY - 1) / 2), rotateY: unit * (offsetX + (sizeX - 1) / 2) };
  }

  const CATEGORY_COLORS = {
    ai: { bg: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#888' },
    web: { bg: 'linear-gradient(135deg, #0f0c29, #302b63)', color: '#aaa' },
    cv: { bg: 'linear-gradient(135deg, #111, #333)', color: '#999' },
    creative: { bg: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)', color: '#bbb' },
  };

  function getTileContent(index, itemData) {
    const data = itemData && index < itemData.length ? itemData[index % itemData.length] : null;
    const cat = data?.category || 'web';
    const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.web;
    return { title: data?.title || '', category: cat, gradient: colors.bg, color: colors.color };
  }

  function openItem(el) {
    if (state.opening) return;
    state.opening = true;
    state.openStartedAt = performance.now();
    document.body.classList.add('dg-scroll-lock');

    const parent = el.parentElement;
    const imgEl = el.querySelector('img');
    const labelEl = el.querySelector('.item__label');
    const idx = parseInt(parent.dataset.index);
    const projectData = cfg.items[idx % cfg.items.length];
    const tileInfo = getTileContent(idx, cfg.items);

    state.focusedItem = el;
    el.setAttribute('data-focused', 'true');

    const offsetX = getDataNumber(parent, 'offsetX', 0);
    const offsetY = getDataNumber(parent, 'offsetY', 0);
    const sizeX = getDataNumber(parent, 'sizeX', 2);
    const sizeY = getDataNumber(parent, 'sizeY', 2);
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, cfg.segments);
    const parentY = ((parentRot.rotateY % 360) + 360) % 360;
    const globalY = ((state.rotation.y % 360) + 360) % 360;
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - state.rotation.x;
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference';
    refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);

    void refDiv.offsetHeight;

    const tileR = refDiv.getBoundingClientRect();
    const mainR = mainEl.getBoundingClientRect();
    const frameR = frameEl.getBoundingClientRect();

    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      state.opening = false;
      state.focusedItem = null;
      parent.removeChild(refDiv);
      document.body.classList.remove('dg-scroll-lock');
      return;
    }

    state.originalTilePos = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
    el.style.visibility = 'hidden';
    el.style.zIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'enlarge';

    const inner = document.createElement('div');
    inner.className = 'enlarge__inner';

    if (imgEl && imgEl.src && imgEl.style.display !== 'none') {
      const imgClone = document.createElement('img');
      imgClone.src = imgEl.src;
      imgClone.draggable = false;
      inner.appendChild(imgClone);
    } else {
      const grad = tileInfo.gradient;
      inner.style.background = grad;
      inner.style.display = 'flex';
      inner.style.alignItems = 'center';
      inner.style.justifyContent = 'center';
      inner.style.flexDirection = 'column';
      inner.style.gap = '8px';
      const title = document.createElement('h3');
      title.textContent = tileInfo.title;
      title.style.cssText = 'color:#fff;font-family:JetBrains Mono;font-size:1.2rem;text-align:center;padding:0 16px;';
      inner.appendChild(title);
      if (projectData) {
        const desc = document.createElement('p');
        desc.textContent = projectData.description;
        desc.style.cssText = 'color:#888;font-family:Inter;font-size:0.8rem;text-align:center;padding:0 20px;line-height:1.5;max-width:320px;';
        inner.appendChild(desc);
        const techs = document.createElement('div');
        techs.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:0 16px;margin-top:8px;';
        (projectData.tech || []).forEach(t => {
          const s = document.createElement('span');
          s.textContent = t;
          s.style.cssText = 'font-family:JetBrains Mono;font-size:0.6rem;padding:4px 10px;border-radius:4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#666;';
          techs.appendChild(s);
        });
        inner.appendChild(techs);
        const links = document.createElement('div');
        links.style.cssText = 'display:flex;gap:12px;margin-top:12px;';
        if (projectData.github) {
          const gl = document.createElement('a');
          gl.href = projectData.github;
          gl.target = '_blank';
          gl.textContent = 'Source Code';
          gl.style.cssText = 'font-family:JetBrains Mono;font-size:0.65rem;color:#999;text-decoration:none;padding:6px 14px;border:1px solid rgba(255,255,255,0.12);border-radius:6px;transition:all 0.2s;';
          gl.onmouseenter = () => { gl.style.color = '#fff'; gl.style.borderColor = 'rgba(255,255,255,0.3)'; };
          gl.onmouseleave = () => { gl.style.color = '#999'; gl.style.borderColor = 'rgba(255,255,255,0.12)'; };
          links.appendChild(gl);
        }
        if (projectData.demo && projectData.demo !== projectData.github) {
          const dl = document.createElement('a');
          dl.href = projectData.demo;
          dl.target = '_blank';
          dl.textContent = 'Live Demo';
          dl.style.cssText = 'font-family:JetBrains Mono;font-size:0.65rem;color:#ccc;text-decoration:none;padding:6px 14px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;transition:all 0.2s;';
          dl.onmouseenter = () => { dl.style.color = '#fff'; dl.style.borderColor = 'rgba(255,255,255,0.4)'; };
          dl.onmouseleave = () => { dl.style.color = '#ccc'; dl.style.borderColor = 'rgba(255,255,255,0.2)'; };
          links.appendChild(dl);
        }
        inner.appendChild(links);
      }
    }

    overlay.appendChild(inner);

    overlay.style.position = 'absolute';
    overlay.style.left = frameR.left - mainR.left + 'px';
    overlay.style.top = frameR.top - mainR.top + 'px';
    overlay.style.width = frameR.width + 'px';
    overlay.style.height = frameR.height + 'px';
    overlay.style.opacity = '0';
    overlay.style.zIndex = '30';
    overlay.style.willChange = 'transform, opacity';
    overlay.style.transformOrigin = 'top left';
    overlay.style.transition = `transform ${cfg.enlargeTransitionMs}ms ease, opacity ${cfg.enlargeTransitionMs}ms ease`;
    overlay.style.borderRadius = cfg.openedImageBorderRadius;
    overlay.style.overflow = 'hidden';
    overlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';

    viewerEl.appendChild(overlay);

    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;
    const validSx = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
    const validSy = isFinite(sy0) && sy0 > 0 ? sy0 : 1;
    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx}, ${validSy})`;

    setTimeout(() => {
      if (!overlay.parentElement) return;
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
      root?.setAttribute('data-enlarging', 'true');
    }, 16);

    const needsResize = cfg.openedImageWidth || cfg.openedImageHeight;
    if (needsResize) {
      function onFirstEnd(ev) {
        if (ev.propertyName !== 'transform') return;
        overlay.removeEventListener('transitionend', onFirstEnd);
        overlay.style.transition = 'none';
        const w = cfg.openedImageWidth || frameR.width + 'px';
        const h = cfg.openedImageHeight || frameR.height + 'px';
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `position:absolute;width:${w};height:${h};visibility:hidden;`;
        document.body.appendChild(tempDiv);
        const tempR = tempDiv.getBoundingClientRect();
        document.body.removeChild(tempDiv);

        overlay.style.width = frameR.width + 'px';
        overlay.style.height = frameR.height + 'px';
        void overlay.offsetWidth;
        overlay.style.transition = `left ${cfg.enlargeTransitionMs}ms ease, top ${cfg.enlargeTransitionMs}ms ease, width ${cfg.enlargeTransitionMs}ms ease, height ${cfg.enlargeTransitionMs}ms ease`;
        const centeredLeft = frameR.left - mainR.left + (frameR.width - tempR.width) / 2;
        const centeredTop = frameR.top - mainR.top + (frameR.height - tempR.height) / 2;
        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`;
          overlay.style.top = `${centeredTop}px`;
          overlay.style.width = w;
          overlay.style.height = h;
          inner.style.width = '100%';
          inner.style.height = '100%';
        });
        overlay.addEventListener('transitionend', () => {}, { once: true });
      }
      overlay.addEventListener('transitionend', onFirstEnd);
    }
  }

  function closeItem() {
    if (performance.now() - state.openStartedAt < 250) return;
    const el = state.focusedItem;
    if (!el) return;
    const parent = el.parentElement;
    const overlay = viewerEl.querySelector('.enlarge');
    if (!overlay) return;
    const refDiv = parent.querySelector('.item__image--reference');
    const origPos = state.originalTilePos;

    if (!origPos) {
      cleanupOverlay(overlay, refDiv, parent, el);
      return;
    }

    const currentRect = overlay.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const origRoot = {
      left: origPos.left - rootRect.left,
      top: origPos.top - rootRect.top,
      width: origPos.width,
      height: origPos.height
    };
    const overlayRoot = {
      left: currentRect.left - rootRect.left,
      top: currentRect.top - rootRect.top,
      width: currentRect.width,
      height: currentRect.height
    };

    const animOverlay = document.createElement('div');
    animOverlay.className = 'enlarge-closing';
    animOverlay.style.cssText = `position:absolute;left:${overlayRoot.left}px;top:${overlayRoot.top}px;width:${overlayRoot.width}px;height:${overlayRoot.height}px;z-index:9999;border-radius:${cfg.openedImageBorderRadius};overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${cfg.enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;

    const origInner = overlay.querySelector('.enlarge__inner');
    if (origInner) {
      const clone = origInner.cloneNode(true);
      clone.style.width = '100%';
      clone.style.height = '100%';
      animOverlay.appendChild(clone);
    }
    overlay.remove();
    root.appendChild(animOverlay);
    void animOverlay.offsetHeight;
    requestAnimationFrame(() => {
      animOverlay.style.left = origRoot.left + 'px';
      animOverlay.style.top = origRoot.top + 'px';
      animOverlay.style.width = origRoot.width + 'px';
      animOverlay.style.height = origRoot.height + 'px';
      animOverlay.style.opacity = '0';
    });

    function cleanup() {
      animOverlay.remove();
      state.originalTilePos = null;
      if (refDiv) refDiv.remove();
      parent.style.transition = 'none';
      el.style.transition = 'none';
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      requestAnimationFrame(() => {
        el.style.visibility = '';
        el.style.opacity = '0';
        el.style.zIndex = 0;
        state.focusedItem = null;
        root?.removeAttribute('data-enlarging');
        requestAnimationFrame(() => {
          parent.style.transition = '';
          el.style.transition = 'opacity 300ms ease-out';
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            setTimeout(() => {
              el.style.transition = '';
              el.style.opacity = '';
              state.opening = false;
              if (!state.dragging && root?.getAttribute('data-enlarging') !== 'true') {
                document.body.classList.remove('dg-scroll-lock');
              }
            }, 300);
          });
        });
      });
    }
    animOverlay.addEventListener('transitionend', cleanup, { once: true });
  }

  function cleanupOverlay(overlay, refDiv, parent, el) {
    overlay.remove();
    if (refDiv) refDiv.remove();
    parent.style.setProperty('--rot-y-delta', '0deg');
    parent.style.setProperty('--rot-x-delta', '0deg');
    el.style.visibility = '';
    el.style.zIndex = 0;
    state.focusedItem = null;
    root?.removeAttribute('data-enlarging');
    state.opening = false;
    document.body.classList.remove('dg-scroll-lock');
  }

  function initEvents() {
    if (!mainEl) return;

    mainEl.addEventListener('pointerdown', onPointerDown);
    mainEl.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    scrimEl?.addEventListener('click', closeItem);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeItem(); });

    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      resizeDome(cr.width, cr.height);
    });
    ro.observe(root);
  }

  function resizeDome(w, h) {
    const minDim = Math.min(w, h), maxDim = Math.max(w, h), aspect = w / h;
    let basis;
    switch (cfg.fitBasis) {
      case 'min': basis = minDim; break;
      case 'max': basis = maxDim; break;
      case 'width': basis = w; break;
      case 'height': basis = h; break;
      default: basis = aspect >= 1.3 ? w : minDim;
    }
    let radius = basis * cfg.fit;
    radius = Math.min(radius, h * 1.35);
    radius = clamp(radius, cfg.minRadius, cfg.maxRadius);
    state.lockedRadius = Math.round(radius);
    const viewerPad = Math.max(8, Math.round(minDim * cfg.padFactor));
    root.style.setProperty('--radius', `${state.lockedRadius}px`);
    root.style.setProperty('--viewer-pad', `${viewerPad}px`);
    root.style.setProperty('--segments-x', cfg.segments);
    root.style.setProperty('--segments-y', cfg.segments);
    applyTransform(state.rotation.x, state.rotation.y);
  }

  function destroy() {
    document.body.classList.remove('dg-scroll-lock');
    container.innerHTML = '';
  }

  build();
  initEvents();

  return { destroy, close: closeItem, reopen: () => build() };
}

/* Initialize dome gallery for projects */
function initProjectDome(projectData) {
  const container = document.getElementById('domeGallery');
  if (!container) return null;

  const projectsWithAlt = (projectData || []).map(p => ({
    src: '',
    alt: p.title,
    title: p.title,
    description: p.description,
    category: p.category,
    tech: p.tech || [],
    github: p.github || '',
    demo: p.demo || ''
  }));

  const gallery = DomeGallery(container, {
    items: projectsWithAlt,
    grayscale: true,
    maxVerticalRotationDeg: 20,
    dragDampening: 3.6,
    minRadius: 750,
    openedImageWidth: '420px',
    openedImageHeight: '340px',
  });

  return gallery;
}
