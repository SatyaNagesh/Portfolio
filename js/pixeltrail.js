(function() {
  const gridSize = 50;
  const color = '#b1b0b5';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;display:block';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');

  let W, H, mx = -1000, my = -1000;

  function resize() {
    const dpr = devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener('touchmove', function(e) {
    var t = e.touches[0];
    mx = t.clientX;
    my = t.clientY;
  }, { passive: true });

  document.addEventListener('touchend', function() {
    mx = -1000;
    my = -1000;
  }, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, W, H);

    if (mx < 0 || my < 0) {
      requestAnimationFrame(frame);
      return;
    }

    ctx.fillStyle = color;

    var gx = Math.round(mx / gridSize) * gridSize;
    var gy = Math.round(my / gridSize) * gridSize;

    var dist = Math.sqrt(Math.pow(mx - gx, 2) + Math.pow(my - gy, 2));
    var maxDist = gridSize * 0.6;
    var intensity = Math.max(0, 1 - dist / maxDist);
    intensity = Math.min(intensity * 1.5, 1);

    if (intensity > 0.05) {
      ctx.globalAlpha = intensity * 0.8;
      var s = 2 + intensity * 4;
      ctx.fillRect(gx - s / 2, gy - s / 2, s, s);
    }

    var nearby = 2;
    for (var dy = -nearby; dy <= nearby; dy++) {
      for (var dx = -nearby; dx <= nearby; dx++) {
        if (dx === 0 && dy === 0) continue;
        var nx = gx + dx * gridSize;
        var ny = gy + dy * gridSize;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        var d2 = Math.sqrt(Math.pow(mx - nx, 2) + Math.pow(my - ny, 2));
        var i2 = Math.max(0, 1 - d2 / (gridSize * 2));
        if (i2 > 0.05) {
          ctx.globalAlpha = i2 * 0.5;
          var s2 = Math.max(1, i2 * 3);
          ctx.fillRect(nx - s2 / 2, ny - s2 / 2, s2, s2);
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
