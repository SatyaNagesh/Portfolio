(function() {
  var gridSize = 45;
  var pixelSize = 4;
  var trailDotRadius = 24;
  var fadeRate = 0.05;
  var interpolate = 0.15;
  var color = '#b1b0b5';

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;display:block';
  document.body.insertBefore(canvas, document.body.firstChild);

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:fixed;inset:0;width:0;height:0;overflow:hidden;z-index:0';
  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.id = 'trail-goo';
  var fb = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  fb.setAttribute('in', 'SourceGraphic'); fb.setAttribute('stdDeviation', '2.5'); fb.setAttribute('result', 'blur');
  var fc = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
  fc.setAttribute('in', 'blur'); fc.setAttribute('type', 'matrix');
  fc.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10');
  fc.setAttribute('result', 'goo');
  var fcomp = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
  fcomp.setAttribute('in', 'SourceGraphic'); fcomp.setAttribute('in2', 'goo'); fcomp.setAttribute('operator', 'atop');
  filter.appendChild(fb); filter.appendChild(fc); filter.appendChild(fcomp);
  defs.appendChild(filter); svg.appendChild(defs);
  document.body.insertBefore(svg, document.body.firstChild);
  canvas.style.filter = 'url(#trail-goo)';

  var ctx = canvas.getContext('2d');
  var trailCanvas = document.createElement('canvas');
  var tctx = trailCanvas.getContext('2d');

  var W, H, dpr = window.devicePixelRatio || 1;
  var mx = -1000, my = -1000, sx = -1000, sy = -1000;
  var cols, rows;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    trailCanvas.width = W;
    trailCanvas.height = H;
    cols = Math.ceil(W / gridSize);
    rows = Math.ceil(H / gridSize);
    tctx.fillStyle = 'rgba(0,0,0,1)';
    tctx.fillRect(0, 0, W, H);
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
    if (sx < -500) {
      sx = mx;
      sy = my;
    } else {
      sx += (mx - sx) * interpolate;
      sy += (my - sy) * interpolate;
    }

    tctx.fillStyle = 'rgba(0,0,0,' + fadeRate + ')';
    tctx.fillRect(0, 0, W, H);

    if (sx > 0 && sy > 0) {
      tctx.fillStyle = '#ffffff';
      tctx.beginPath();
      tctx.arc(sx, sy, trailDotRadius, 0, Math.PI * 2);
      tctx.fill();
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var imageData = tctx.getImageData(0, 0, W, H);
    var data = imageData.data;

    ctx.fillStyle = color;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var gx = c * gridSize + gridSize / 2;
        var gy = r * gridSize + gridSize / 2;
        var idx = (Math.round(gy) * W + Math.round(gx)) * 4;
        if (idx >= 0 && idx < data.length) {
          var brightness = data[idx] / 255;
          if (brightness > 0.02) {
            ctx.globalAlpha = Math.min(brightness * 0.9, 0.9);
            ctx.fillRect(gx - pixelSize / 2, gy - pixelSize / 2, pixelSize, pixelSize);
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
