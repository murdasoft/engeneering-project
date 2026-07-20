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
    const attractRadius = 220;
    const attractStrength = 0.5;
    const bulgeStrength = 0.75;
    const bulgeRadius = 100;

    const cells: { x: number; y: number; size: number }[] = [];

    const recalcCells = () => {
      const rect = canvas.getBoundingClientRect();
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;
      cells.length = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            x: c * cellW + cellW / 2,
            y: r * cellH + cellH / 2,
            size: Math.min(cellW, cellH) * 0.28,
          });
        }
      }
    };

    recalcCells();

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

      // Draw grid lines
      ctx.strokeStyle = "rgba(209, 213, 209, 0.12)";
      ctx.lineWidth = 1;
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;

      ctx.beginPath();
      for (let c = 1; c < cols; c++) {
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, rect.height);
      }
      for (let r = 1; r < rows; r++) {
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(rect.width, r * cellH);
      }
      ctx.stroke();

      // Draw cells
      for (const cell of cells) {
        const dx = mx - cell.x;
        const dy = my - cell.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let tx = 0;
        let ty = 0;
        let scale = 1;

        if (dist < attractRadius && dist > 0) {
          const force = 1 - dist / attractRadius;
          const pull = force * attractStrength;
          tx = (dx / dist) * pull * 42;
          ty = (dy / dist) * pull * 42;

          const bulge = Math.max(0, 1 - dist / bulgeRadius) * bulgeStrength;
          scale = 1 + bulge;
        }

        const x = cell.x + tx;
        const y = cell.y + ty;
        const r = cell.size * scale;

        const glow = Math.max(0, 1 - dist / 160);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          x - r * 0.25,
          y - r * 0.25,
          r * 0.1,
          x,
          y,
          r
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        grad.addColorStop(0.45, "rgba(209, 213, 209, 0.45)");
        grad.addColorStop(1, `rgba(15, 92, 99, ${0.12 + glow * 0.18})`);
        ctx.fillStyle = grad;

        if (glow > 0) {
          ctx.shadowBlur = 18 + glow * 12;
          ctx.shadowColor = `rgba(0, 243, 255, ${glow * 0.3})`;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

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
