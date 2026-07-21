"use client";

import { useEffect, useRef } from "react";

export function InteractiveGrid({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const cols = 20;
    const rows = 14;
    const segments = 30;
    const attractRadius = 220;
    const attractStrength = 0.9;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener("mousemove", handleMove, { passive: true });
    canvas.addEventListener("mouseleave", handleLeave);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;

      const displace = (x: number, y: number) => {
        const dx = mx - x;
        const dy = my - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let tx = 0;
        let ty = 0;
        if (dist < attractRadius && dist > 0) {
          const force = (1 - dist / attractRadius) * attractStrength;
          tx = (dx / dist) * force * 60;
          ty = (dy / dist) * force * 60;
        }
        return { x: x + tx, y: y + ty };
      };

      ctx.strokeStyle = "rgba(209, 213, 209, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let c = 1; c < cols; c++) {
        const baseX = c * cellW;
        for (let s = 0; s <= segments; s++) {
          const y = (s / segments) * rect.height;
          const p = displace(baseX, y);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      }

      for (let r = 1; r < rows; r++) {
        const baseY = r * cellH;
        for (let s = 0; s <= segments; s++) {
          const x = (s / segments) * rect.width;
          const p = displace(x, baseY);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      }

      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      aria-hidden="true"
    />
  );
}
