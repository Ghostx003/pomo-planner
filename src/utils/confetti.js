/**
 * Lightweight, high-performance canvas confetti animation.
 * Zero external dependencies.
 */

export function fireConfetti(options = {}) {
  const particleCount = options.particleCount || 150;
  const colors = options.colors || [
    '#10b981', // emerald
    '#38bdf8', // sky
    '#6366f1', // indigo
    '#a855f7', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#f43f5e', // rose
    '#fbbf24', // gold
    '#34d399', // mint
  ];

  // Remove existing confetti canvas if any
  const existingCanvas = document.getElementById('pomoplan-confetti-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'pomoplan-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  };
  resize();

  const width = window.innerWidth;
  const height = window.innerHeight;

  const particles = [];
  const shapes = ['rect', 'circle', 'star'];

  for (let i = 0; i < particleCount; i++) {
    // Launch from lower middle area
    const startX = width * 0.5 + (Math.random() - 0.5) * (width * 0.4);
    const startY = height * 0.85;

    // Angle mostly upwards (-60 deg to -120 deg)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.7);
    const speed = Math.random() * 18 + 12;

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.random() * 0.1 + 0.05,
      gravity: 0.38 + Math.random() * 0.15,
      friction: 0.965,
      opacity: 1,
      fadeRate: Math.random() * 0.005 + 0.004,
    });
  }

  let animationFrameId;
  const startTime = Date.now();
  const maxDurationMs = 3500;

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function render() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.vx *= p.friction;
      p.vy = p.vy * p.friction + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      // Start fading out after 1.5 seconds or as life runs out
      if (elapsed > 1500) {
        p.opacity -= p.fadeRate * 1.5;
      }

      if (p.opacity <= 0 || p.y > height + 50) {
        continue;
      }

      activeCount++;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(p.wobble), 1);
      ctx.globalAlpha = Math.max(0, p.opacity);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.shape === 'star') {
        drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45, p.color);
      } else {
        // Ribbon / Rectangle
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size * 0.75, p.size, p.size * 1.5);
      }

      ctx.restore();
    }

    if (activeCount > 0 && elapsed < maxDurationMs) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
