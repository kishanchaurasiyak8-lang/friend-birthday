/**
 * ==========================================================================
 * THE MIDNIGHT ENTRANCE — CANVAS HEART ANIMATION (java.js)
 * High-performance, mathematical parametric heart animation with requestAnimationFrame
 * ==========================================================================
 */

(function () {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  // Parametric Heart Point Formula
  function getHeartPoint(t, scale) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * scale, y: y * scale };
  }

  // Orbiting Golden Particles
  const orbitParticles = [];
  for (let i = 0; i < 45; i++) {
    orbitParticles.push({
      t: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.008 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      size: Math.random() * 2.5 + 1.2,
      color: Math.random() > 0.3 ? "#FFD700" : "#D4AF37",
      alpha: Math.random() * 0.8 + 0.2,
    });
  }

  // Floating Glitter & Sparkles
  const sparkles = [];
  for (let i = 0; i < 40; i++) {
    sparkles.push({
      x: (Math.random() - 0.5) * 400,
      y: Math.random() * 300 + 50,
      speedY: Math.random() * 0.9 + 0.35,
      speedX: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? "#FFD700" : "#FF69B4",
    });
  }

  let time = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);
    time += 0.035;

    const centerX = width / 2;
    const centerY = height / 2;

    // Double-beat heartbeat scaling
    const beatCycle = time % (Math.PI * 2);
    let scaleBump = 0;
    if (beatCycle < 0.3) {
      scaleBump = Math.sin((beatCycle / 0.3) * Math.PI) * 0.09;
    } else if (beatCycle > 0.4 && beatCycle < 0.7) {
      scaleBump = Math.sin(((beatCycle - 0.4) / 0.3) * Math.PI) * 0.06;
    }

    const baseScale = Math.min(width, height) / 36;
    const currentScale = baseScale * (1 + scaleBump);

    ctx.save();
    ctx.translate(centerX, centerY);

    // Purple & Rose Halo
    const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, currentScale * 22);
    halo.addColorStop(0, "rgba(91, 33, 182, 0.4)");
    halo.addColorStop(0.5, "rgba(255, 105, 180, 0.12)");
    halo.addColorStop(1, "rgba(8, 6, 17, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, currentScale * 22, 0, Math.PI * 2);
    ctx.fill();

    // Floating Sparkles
    sparkles.forEach((s) => {
      s.y -= s.speedY;
      s.x += s.speedX;
      if (s.y < -currentScale * 18) {
        s.y = currentScale * 16;
        s.x = (Math.random() - 0.5) * currentScale * 20;
      }
      ctx.save();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    });

    // Helper to draw heart contour
    function drawHeart(scaleMult) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
        const pt = getHeartPoint(a, currentScale * scaleMult);
        if (a === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
    }

    // Inner Translucent Heart Fill
    drawHeart(1);
    const innerHeartGrad = ctx.createRadialGradient(0, -currentScale * 2, 5, 0, 0, currentScale * 16);
    innerHeartGrad.addColorStop(0, "rgba(91, 33, 182, 0.7)");
    innerHeartGrad.addColorStop(0.7, "rgba(22, 11, 43, 0.85)");
    innerHeartGrad.addColorStop(1, "rgba(8, 6, 17, 0.95)");
    ctx.fillStyle = innerHeartGrad;
    ctx.fill();

    // Outlines with shadows
    drawHeart(1.05);
    ctx.strokeStyle = "rgba(91, 33, 182, 0.5)";
    ctx.lineWidth = 5;
    ctx.shadowColor = "#5B21B6";
    ctx.shadowBlur = 24;
    ctx.stroke();

    drawHeart(1.02);
    ctx.strokeStyle = "rgba(255, 105, 180, 0.6)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#FF69B4";
    ctx.shadowBlur = 18;
    ctx.stroke();

    drawHeart(1);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Orbiting Golden Particles
    orbitParticles.forEach((p) => {
      p.t += p.speed;
      const pt = getHeartPoint(p.t, currentScale);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
    requestAnimationFrame(render);
  }

  render();
})();
