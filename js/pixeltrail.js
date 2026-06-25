(function() {
  var gridSize = 45;
  var pixelSize = 4;
  var radius = 100;
  var smooth = 0.12;
  var color = '#b1b0b5';

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;display:block;z-index:0;pointer-events:none';
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W, H, mx = -1000, my = -1000, sx = -1000, sy = -1000;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
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
    if (mx < 0) { requestAnimationFrame(frame); return; }

    if (sx < -500) { sx = mx; sy = my; }
    else { sx += (mx - sx) * smooth; sy += (my - sy) * smooth; }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = color;

    var c0 = Math.max(0, Math.floor((sx - radius) / gridSize));
    var c1 = Math.min(Math.ceil(W / gridSize), Math.ceil((sx + radius) / gridSize));
    var r0 = Math.max(0, Math.floor((sy - radius) / gridSize));
    var r1 = Math.min(Math.ceil(H / gridSize), Math.ceil((sy + radius) / gridSize));

    for (var r = r0; r < r1; r++) {
      for (var c = c0; c < c1; c++) {
        var gx = c * gridSize + gridSize / 2;
        var gy = r * gridSize + gridSize / 2;
        var dx = gx - sx;
        var dy = gy - sy;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < radius) {
          var a = (1 - d / radius) * 0.8;
          ctx.globalAlpha = a;
          ctx.fillRect(gx - pixelSize / 2, gy - pixelSize / 2, pixelSize, pixelSize);
        }
      }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
