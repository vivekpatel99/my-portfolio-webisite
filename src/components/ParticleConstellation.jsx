import React, { useEffect, useRef } from 'react';

/**
 * Hand-rolled Canvas 2D particle constellation, styled after computer-vision
 * feature-point matching: drifting keypoints, proximity link lines, mouse
 * repulsion, and an occasional "detection" flourish (bounding box + corner
 * brackets + confidence label).
 *
 * Performance/accessibility contract:
 * - particle count scales with viewport area (lower density on coarse pointers)
 * - devicePixelRatio capped at 2
 * - rAF paused when the tab is hidden or the canvas scrolls offscreen
 * - prefers-reduced-motion renders a single static frame (no animation loop)
 */

const LINK_DISTANCE = 120;
const MOUSE_RADIUS = 150;
const DETECTION_DURATION = 1600;
const DETECTION_LABELS = ['match: 0.98', 'feat: 0.94', 'obj: 0.97', 'track: 0.96'];

const ParticleConstellation = ({ className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const finePointer = window.matchMedia?.('(pointer: fine)')?.matches ?? false;

    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = null;
    let running = false;
    let pageVisible = !document.hidden;
    let onScreen = true;
    let lastTime = 0;
    let detection = null;
    let nextDetectionAt = 0;
    const mouse = { x: null, y: null };

    const rand = (min, max) => min + Math.random() * (max - min);

    const buildParticles = () => {
      const density = finePointer ? 15000 : 26000;
      const cap = finePointer ? 110 : 55;
      const count = Math.max(24, Math.min(Math.round((width * height) / density), cap));
      particles = Array.from({ length: count }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.16, 0.16),
        vy: rand(-0.16, 0.16),
        r: rand(1, 2.2),
      }));
    };

    const drawLinks = () => {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.22;
            ctx.strokeStyle = `rgba(147, 114, 255, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    const drawParticles = () => {
      for (const p of particles) {
        ctx.fillStyle = 'rgba(190, 165, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawDetection = (now) => {
      if (!detection) return;
      const progress = (now - detection.start) / DETECTION_DURATION;
      if (progress >= 1) {
        detection = null;
        nextDetectionAt = now + rand(2600, 5200);
        return;
      }
      const alpha = Math.sin(Math.PI * progress) * 0.55;
      const { x, y, w, h, label } = detection;
      const bracket = Math.min(14, w * 0.25);

      ctx.strokeStyle = `rgba(147, 114, 255, ${(alpha * 0.5).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.strokeStyle = `rgba(212, 180, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      const corners = [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1],
      ];
      for (const [cx, cy, dirX, dirY] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx + bracket * dirX, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + bracket * dirY);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(212, 180, 255, ${alpha.toFixed(3)})`;
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(label, x, Math.max(10, y - 6));
    };

    const maybeStartDetection = (now) => {
      if (detection || reducedMotion || now < nextDetectionAt || particles.length === 0) return;
      const anchor = particles[Math.floor(Math.random() * particles.length)];
      const w = rand(64, 110);
      const h = rand(50, 90);
      detection = {
        x: Math.min(Math.max(anchor.x - w / 2, 8), Math.max(8, width - w - 8)),
        y: Math.min(Math.max(anchor.y - h / 2, 16), Math.max(16, height - h - 8)),
        w,
        h,
        start: now,
        label: DETECTION_LABELS[Math.floor(Math.random() * DETECTION_LABELS.length)],
      };
    };

    const update = (dt) => {
      const step = Math.min(dt, 48) / 16.67;
      for (const p of particles) {
        p.x += p.vx * step;
        p.y += p.vy * step;

        if (mouse.x !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.5 && dist < MOUSE_RADIUS) {
            const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 0.6 * step;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;
        if (p.y < -8) p.y = height + 8;
        if (p.y > height + 8) p.y = -8;
      }
    };

    const drawFrame = (now) => {
      ctx.clearRect(0, 0, width, height);
      drawLinks();
      drawParticles();
      drawDetection(now);
    };

    const tick = (now) => {
      rafId = null;
      if (!running) return;
      const dt = lastTime ? now - lastTime : 16.67;
      lastTime = now;
      update(dt);
      maybeStartDetection(now);
      drawFrame(now);
      rafId = requestAnimationFrame(tick);
    };

    const syncRunning = () => {
      const shouldRun = !reducedMotion && pageVisible && onScreen;
      if (shouldRun && !running) {
        running = true;
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
      if (reducedMotion) {
        drawFrame(performance.now());
      }
    };

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      syncRunning();
    };

    const handlePointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouse.x = null;
        mouse.y = null;
      } else {
        mouse.x = x;
        mouse.y = y;
      }
    };

    const handlePointerLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);

    let observer = null;
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        syncRunning();
      });
      observer.observe(canvas);
    }

    if (finePointer && !reducedMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', handlePointerLeave);
    }

    syncRunning();

    return () => {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
      if (finePointer && !reducedMotion) {
        window.removeEventListener('pointermove', handlePointerMove);
        document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full ${className}`.trim()}
      aria-hidden="true"
    />
  );
};

export default ParticleConstellation;
