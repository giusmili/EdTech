'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const N = 75;
const LINK_DIST = 160;
const REPEL_DIST = 110;
const REPEL_FORCE = 0.9;
const BASE_SPEED = 0.25;

export default function MoleculeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    particles.current = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * BASE_SPEED * 2,
      vy: (Math.random() - 0.5) * BASE_SPEED * 2,
      r: Math.random() * 1.5 + 0.8,
    }));

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const pts = particles.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of pts) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_DIST * REPEL_DIST && d2 > 0) {
          const d = Math.sqrt(d2);
          const f = ((REPEL_DIST - d) / REPEL_DIST) * REPEL_FORCE;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;

        if (Math.hypot(p.vx, p.vy) < BASE_SPEED) {
          p.vx += (Math.random() - 0.5) * 0.06;
          p.vy += (Math.random() - 0.5) * 0.06;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > width) { p.x = width; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > height) { p.y = height; p.vy = -Math.abs(p.vy); }
      }

      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            ctx.globalAlpha = (1 - d / LINK_DIST) * 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#ffffff';
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
