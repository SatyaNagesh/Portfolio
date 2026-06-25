(function() {
  const GRID = 50;
  const TRAIL_SIZE = 0.12;
  const MAX_AGE = 450;
  const INTERPOLATE = 0.15;
  const COLOR = '#b1b0b5';

  const canvas = document.createElement('canvas');
  canvas.className = 'pixeltrail-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100vw', height: '100vh',
    zIndex: '0', pointerEvents: 'none', display: 'block'
  });
  document.body.prepend(canvas);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  Object.assign(svg.style, { position: 'fixed', inset: '0', width: '0', height: '0', overflow: 'hidden' });
  const defs = document.createElementNS(svgNS, 'defs');
  const filter = document.createElementNS(svgNS, 'filter');
  filter.setAttribute('id', 'pixeltrail-goo');
  const blur = document.createElementNS(svgNS, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '2');
  blur.setAttribute('result', 'blur');
  filter.appendChild(blur);
  const cm = document.createElementNS(svgNS, 'feColorMatrix');
  cm.setAttribute('in', 'blur');
  cm.setAttribute('type', 'matrix');
  cm.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9');
  cm.setAttribute('result', 'goo');
  filter.appendChild(cm);
  const comp = document.createElementNS(svgNS, 'feComposite');
  comp.setAttribute('in', 'SourceGraphic');
  comp.setAttribute('in2', 'goo');
  comp.setAttribute('operator', 'atop');
  filter.appendChild(comp);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.prepend(svg);
  canvas.style.filter = 'url(#pixeltrail-goo)';

  const ctx = canvas.getContext('2d');
  let W, H;
  let mx = -1000, my = -1000;
  let px = -1000, py = -1000;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mx = t.clientX; my = t.clientY;
  }, { passive: true });
  document.addEventListener('touchend', () => { mx = -1000; my = -1000; }, { passive: true });

  const trailCanvas = document.createElement('canvas');
  const trailCtx = trailCanvas.getContext('2d');

  function initTrail() {
    trailCanvas.width = W;
    trailCanvas.height = H;
    trailCtx.fillStyle = 'rgba(0,0,0,0)';
    trailCtx.fillRect(0, 0, W, H);
  }
  initTrail();

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw(time) {
    px = lerp(px, mx, INTERPOLATE);
    py = lerp(py, my, INTERPOLATE);

    trailCtx.fillStyle = 'rgba(0,0,0,' + (1 / MAX_AGE * 2) + ')';
    trailCtx.fillRect(0, 0, W, H);

    if (px > 0 && py > 0) {
      trailCtx.fillStyle = 'rgba(255,255,255,1)';
      const r = TRAIL_SIZE * Math.min(W, H) * 0.5;
      trailCtx.beginPath();
      trailCtx.arc(px, py, r, 0, Math.PI * 2);
      trailCtx.fill();
    }

    ctx.clearRect(0, 0, W, H);

    const imageData = trailCtx.getImageData(0, 0, W, H);
    const data = imageData.data;

    ctx.fillStyle = COLOR;
    for (let y = 0; y < H; y += GRID) {
      for (let x = 0; x < W; x += GRID) {
        const idx = (y * W + x) * 4;
        const brightness = data[idx] / 255;
        if (brightness > 0.01) {
          const size = 2 * brightness;
          ctx.globalAlpha = brightness * 0.8;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
