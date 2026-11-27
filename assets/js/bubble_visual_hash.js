// Academic Cover Visual Hash Generator
// Deterministically renders a sleek, publication-grade scientific SVG cover when no cover image is provided.
(function () {
  function hashBytes(str) {
    var s = String(str || 'academic-paper');
    var h1 = 0x811c9dc5;
    var h2 = 0x9e3779b9;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 = Math.imul(h2 ^ ch, 0x85ebca6b);
    }
    var out = [];
    var seed = (h1 >>> 0) ^ (h2 >>> 0);
    for (var j = 0; j < 32; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      out.push((seed >>> 24) & 0xff);
    }
    return out;
  }

  var PALETTES = [
    { bg1: '#0f172a', bg2: '#1e3a5f', p1: '#38bdf8', p2: '#818cf8', fg: '#f8fafc', muted: 'rgba(248,250,252,0.72)', grid: 'rgba(255,255,255,0.06)', pill: 'rgba(56,189,248,0.18)', dark: true },
    { bg1: '#0c2239', bg2: '#1a4a6e', p1: '#60a5fa', p2: '#34d399', fg: '#f8fafc', muted: 'rgba(248,250,252,0.74)', grid: 'rgba(255,255,255,0.06)', pill: 'rgba(52,211,153,0.18)', dark: true },
    { bg1: '#162621', bg2: '#27433a', p1: '#6ee7b7', p2: '#93c5fd', fg: '#f8fafc', muted: 'rgba(248,250,252,0.72)', grid: 'rgba(255,255,255,0.06)', pill: 'rgba(110,231,183,0.18)', dark: true },
    { bg1: '#18181b', bg2: '#2d3138', p1: '#357ace', p2: '#60a5fa', fg: '#fafafa', muted: 'rgba(250,250,250,0.72)', grid: 'rgba(255,255,255,0.05)', pill: 'rgba(96,165,250,0.18)', dark: true },
    { bg1: '#1e1b4b', bg2: '#312e81', p1: '#22d3ee', p2: '#a78bfa', fg: '#f8fafc', muted: 'rgba(248,250,252,0.74)', grid: 'rgba(255,255,255,0.06)', pill: 'rgba(34,211,238,0.18)', dark: true },
    { bg1: '#f8fafc', bg2: '#e8eff7', p1: '#357ace', p2: '#359466', fg: '#0f172a', muted: 'rgba(15,23,42,0.68)', grid: 'rgba(53,122,206,0.08)', pill: 'rgba(53,122,206,0.12)', dark: false },
  ];

  function el(tag, attrs, parent) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, String(attrs[k]));
      });
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function extractShortLabel(title) {
    var t = String(title || '').trim();
    if (!t) return 'Research Paper';
    var colonIdx = t.indexOf(':');
    if (colonIdx > 1 && colonIdx <= 18) {
      return t.slice(0, colonIdx).trim();
    }
    var words = t.split(/\s+/).filter(Boolean);
    if (words.length <= 3) return t;
    return words.slice(0, 3).join(' ') + '...';
  }

  function drawGrid(svg, w, h, pal) {
    var step = 24;
    for (var x = step; x < w; x += step) {
      el('line', { x1: x, y1: 0, x2: x, y2: h, stroke: pal.grid, 'stroke-width': 1 }, svg);
    }
    for (var y = step; y < h; y += step) {
      el('line', { x1: 0, y1: y, x2: w, y2: y, stroke: pal.grid, 'stroke-width': 1 }, svg);
    }
  }

  function drawNeuralMesh(svg, bytes, w, h, pal) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      pts.push({
        x: 35 + ((bytes[i] / 255) * (w - 60)),
        y: 22 + ((bytes[i + 10] / 255) * (h - 70)),
        r: 2.5 + (bytes[i + 20] % 4),
      });
    }
    for (var a = 0; a < pts.length; a++) {
      for (var b = a + 1; b < pts.length; b++) {
        var dx = pts[a].x - pts[b].x;
        var dy = pts[a].y - pts[b].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 105) {
          el('line', {
            x1: pts[a].x.toFixed(1),
            y1: pts[a].y.toFixed(1),
            x2: pts[b].x.toFixed(1),
            y2: pts[b].y.toFixed(1),
            stroke: (a + b) % 2 === 0 ? pal.p1 : pal.p2,
            'stroke-opacity': (0.42 - dist / 280).toFixed(2),
            'stroke-width': 1.2,
          }, svg);
        }
      }
    }
    pts.forEach(function (pt, idx) {
      if (idx % 3 === 0) {
        el('circle', {
          cx: pt.x.toFixed(1),
          cy: pt.y.toFixed(1),
          r: (pt.r * 2.4).toFixed(1),
          fill: 'none',
          stroke: pal.p1,
          'stroke-opacity': 0.28,
          'stroke-width': 1,
        }, svg);
      }
      el('circle', {
        cx: pt.x.toFixed(1),
        cy: pt.y.toFixed(1),
        r: pt.r.toFixed(1),
        fill: idx % 2 === 0 ? pal.p1 : pal.p2,
        'fill-opacity': 0.85,
      }, svg);
    });
  }

  function drawContours(svg, bytes, w, h, pal) {
    var cx = w * (0.55 + (bytes[2] % 25) / 100);
    var cy = h * (0.38 + (bytes[3] % 20) / 100);
    for (var i = 1; i <= 7; i++) {
      var rx = 20 + i * 21;
      var ry = 14 + i * 14;
      var rot = ((bytes[i] % 40) - 20);
      el('ellipse', {
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        rx: rx,
        ry: ry,
        transform: 'rotate(' + rot + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')',
        fill: 'none',
        stroke: i % 2 === 0 ? pal.p1 : pal.p2,
        'stroke-opacity': (0.48 - i * 0.045).toFixed(2),
        'stroke-width': i === 3 ? 1.8 : 1.1,
        'stroke-dasharray': i % 3 === 0 ? '4 4' : 'none',
      }, svg);
    }
    // Precision crosshair
    el('line', { x1: cx - 10, y1: cy, x2: cx + 10, y2: cy, stroke: pal.p1, 'stroke-opacity': 0.65, 'stroke-width': 1.2 }, svg);
    el('line', { x1: cx, y1: cy - 10, x2: cx, y2: cy + 10, stroke: pal.p1, 'stroke-opacity': 0.65, 'stroke-width': 1.2 }, svg);
  }

  function drawAttentionMatrix(svg, bytes, w, h, pal) {
    var cols = 7;
    var rows = 4;
    var cellW = 24;
    var cellH = 20;
    var startX = w - cols * (cellW + 4) - 18;
    var startY = 20;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = bytes[(r * cols + c) % bytes.length] / 255;
        var isDiag = r === c || Math.abs(r - c) === 1;
        var opacity = isDiag ? 0.48 + v * 0.32 : 0.08 + v * 0.24;
        el('rect', {
          x: startX + c * (cellW + 4),
          y: startY + r * (cellH + 4),
          width: cellW,
          height: cellH,
          rx: 4,
          fill: (r + c) % 3 === 0 ? pal.p2 : pal.p1,
          'fill-opacity': opacity.toFixed(2),
        }, svg);
      }
    }
  }

  function drawWaves(svg, bytes, w, h, pal) {
    for (var layer = 0; layer < 4; layer++) {
      var baseY = 48 + layer * 24;
      var amp = 14 + (bytes[layer] % 18);
      var freq = 0.018 + (bytes[layer + 4] % 10) * 0.0015;
      var phase = (bytes[layer + 8] / 255) * Math.PI * 2;
      var d = 'M 0 ' + baseY;
      for (var x = 12; x <= w; x += 12) {
        var y = baseY + Math.sin(x * freq + phase) * amp;
        d += ' L ' + x + ' ' + y.toFixed(1);
      }
      el('path', {
        d: d,
        fill: 'none',
        stroke: layer % 2 === 0 ? pal.p1 : pal.p2,
        'stroke-opacity': (0.55 - layer * 0.08).toFixed(2),
        'stroke-width': layer === 0 ? 2.2 : 1.3,
      }, svg);
    }
  }

  function renderAcademicCover(svg, options) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var w = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) || 300;
    var h = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height) || 200;
    var seedStr = options.seed || options.title || 'paper';
    var bytes = hashBytes(seedStr);
    var pal = PALETTES[typeof options.paletteIdx === 'number' ? options.paletteIdx % PALETTES.length : bytes[0] % PALETTES.length];
    var motif = typeof options.motifIdx === 'number' ? options.motifIdx % 4 : bytes[1] % 4;

    var gradId = 'acg-' + bytes[0] + '-' + bytes[1] + '-' + bytes[2] + '-' + Math.floor(Math.random() * 10000);
    var defs = el('defs', {}, svg);
    var grad = el('linearGradient', { id: gradId, x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs);
    el('stop', { offset: '0%', 'stop-color': pal.bg1 }, grad);
    el('stop', { offset: '100%', 'stop-color': pal.bg2 }, grad);

    // Background + subtle border
    el('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#' + gradId + ')' }, svg);
    drawGrid(svg, w, h, pal);

    // Decorative ambient glow
    el('circle', {
      cx: (w * 0.82).toFixed(0),
      cy: (h * 0.22).toFixed(0),
      r: 72,
      fill: pal.p1,
      'fill-opacity': pal.dark ? 0.12 : 0.09,
    }, svg);

    if (motif === 0) drawNeuralMesh(svg, bytes, w, h, pal);
    else if (motif === 1) drawContours(svg, bytes, w, h, pal);
    else if (motif === 2) drawAttentionMatrix(svg, bytes, w, h, pal);
    else drawWaves(svg, bytes, w, h, pal);

    // Bottom editorial typography card strip
    el('rect', {
      x: 0,
      y: h - 68,
      width: w,
      height: 68,
      fill: pal.dark ? 'rgba(9, 14, 24, 0.56)' : 'rgba(255, 255, 255, 0.82)',
    }, svg);
    el('line', {
      x1: 0,
      y1: h - 68,
      x2: w,
      y2: h - 68,
      stroke: pal.p1,
      'stroke-opacity': 0.35,
      'stroke-width': 1,
    }, svg);

    // Accent bar
    el('rect', { x: 16, y: h - 52, width: 3, height: 36, rx: 1.5, fill: pal.p1 }, svg);

    var label = extractShortLabel(options.title);
    var titleEl = el('text', {
      x: 27,
      y: h - 35,
      fill: pal.fg,
      'font-family': '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
      'font-size': label.length > 16 ? '13.5' : '16',
      'font-weight': '700',
      'letter-spacing': '-0.01em',
    }, svg);
    titleEl.textContent = label;

    var subParts = [];
    if (options.venue) subParts.push(options.venue);
    if (options.year) subParts.push(options.year);
    var subText = subParts.join(' · ') || 'Academic Publication';
    if (subText.length > 36) subText = subText.slice(0, 34) + '…';

    var subEl = el('text', {
      x: 27,
      y: h - 18,
      fill: pal.muted,
      'font-family': '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
      'font-size': '10.5',
      'font-weight': '500',
    }, svg);
    subEl.textContent = subText;

    // Subtle border
    el('rect', {
      x: 0.5,
      y: 0.5,
      width: w - 1,
      height: h - 1,
      fill: 'none',
      stroke: pal.dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)',
    }, svg);
  }

  window.renderAcademicCover = renderAcademicCover;

  var canvases = document.querySelectorAll('.bubble-visual-hash');
  canvases.forEach(function (canvas) {
    renderAcademicCover(canvas, {
      seed: canvas.getAttribute('data-bubble-visual-hash') || '',
      title: canvas.getAttribute('data-pub-title') || '',
      venue: canvas.getAttribute('data-pub-venue') || '',
      year: canvas.getAttribute('data-pub-year') || '',
    });
  });
})();
