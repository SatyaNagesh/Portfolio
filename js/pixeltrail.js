(function() {
  var gridSize = 5;
  var trailSize = 0.25;
  var maxAge = 500;
  var interpolate = 2;
  var color = '#b1b0b5';
  var gooeyStrength = 2;

  var pixelSize = 5;
  var smoothFactor = 1 / interpolate;

  var TRAIL_RES = 256;

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;display:block;z-index:0;pointer-events:none';
  document.body.insertBefore(canvas, document.body.firstChild);

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:fixed;inset:0;width:0;height:0;overflow:hidden;z-index:0';
  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.id = 'pt-goo';
  var b = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  b.setAttribute('in', 'SourceGraphic'); b.setAttribute('stdDeviation', String(gooeyStrength)); b.setAttribute('result', 'blur');
  var cm = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
  cm.setAttribute('in', 'blur'); cm.setAttribute('type', 'matrix');
  cm.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10');
  cm.setAttribute('result', 'goo');
  var comp = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
  comp.setAttribute('in', 'SourceGraphic'); comp.setAttribute('in2', 'goo'); comp.setAttribute('operator', 'atop');
  filter.appendChild(b); filter.appendChild(cm); filter.appendChild(comp);
  defs.appendChild(filter); svg.appendChild(defs);
  document.body.insertBefore(svg, document.body.firstChild);
  canvas.style.filter = 'url(#pt-goo)';

  var ctx = canvas.getContext('2d');

  var trail = document.createElement('canvas');
  var tc = trail.getContext('2d');
  trail.width = TRAIL_RES;
  trail.height = TRAIL_RES;
  tc.fillStyle = '#000';
  tc.fillRect(0, 0, TRAIL_RES, TRAIL_RES);

  var dpr = window.devicePixelRatio || 1;
  var W, H, mx = -1000, my = -1000, sx = -1000, sy = -1000;

  var fade = 1 - Math.pow(0.01, 1 / (maxAge / (1000 / 60)));

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
  });
  document.addEventListener('touchmove', function(e) {
    var t = e.touches[0]; mx = t.clientX; my = t.clientY;
  }, { passive: true });
  document.addEventListener('touchend', function() {
    mx = -1000; my = -1000;
  }, { passive: true });

  var cols = 0, rows = 0;

  function frame() {
    cols = Math.ceil(W / gridSize);
    rows = Math.ceil(H / gridSize);

    if (mx < 0) { requestAnimationFrame(frame); return; }

    if (sx < -500) { sx = mx; sy = my; }
    else { sx += (mx - sx) * smoothFactor; sy += (my - sy) * smoothFactor; }

    tc.fillStyle = 'rgba(0,0,0,' + fade + ')';
    tc.fillRect(0, 0, TRAIL_RES, TRAIL_RES);

    var ux = (sx / W) * TRAIL_RES;
    var uy = (sy / H) * TRAIL_RES;
    var tr = Math.max(2, trailSize * TRAIL_RES * 0.8);
    tc.fillStyle = '#fff';
    tc.beginPath();
    tc.arc(ux, uy, tr, 0, Math.PI * 2);
    tc.fill();

    var img = tc.getImageData(0, 0, TRAIL_RES, TRAIL_RES);
    var d = img.data;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = color;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var gx = c * gridSize + gridSize / 2;
        var gy = r * gridSize + gridSize / 2;
        var tu = Math.round((gx / W) * TRAIL_RES);
        var tv = Math.round((gy / H) * TRAIL_RES);
        if (tu < 0) tu = 0; if (tu >= TRAIL_RES) tu = TRAIL_RES - 1;
        if (tv < 0) tv = 0; if (tv >= TRAIL_RES) tv = TRAIL_RES - 1;
        var b = d[(tv * TRAIL_RES + tu) * 4] / 255;
        if (b > 0.01) {
          ctx.globalAlpha = Math.min(b * 0.85, 0.85);
          ctx.fillRect(gx - pixelSize / 2, gy - pixelSize / 2, pixelSize, pixelSize);
        }
      }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
