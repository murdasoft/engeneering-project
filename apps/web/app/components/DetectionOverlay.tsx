"use client";

import { useEffect, useRef, useState } from "react";

type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: number[][] | null;
};

type OverlayItem = {
  id?: string | number;
  class?: string;
  className?: string;
  confidence?: number;
  severity?: string;
  bbox: BBox;
};

function severityColor(item: OverlayItem): string {
  const cls = (item.class || item.className || "").toLowerCase();
  if (cls === "other") return "#94a3b8";
  const sev = (item.severity || "low").toUpperCase();
  if (sev === "CRITICAL" || sev === "HIGH") return sev === "CRITICAL" ? "#ef4444" : "#f97316";
  if (sev === "MEDIUM") return "#f59e0b";
  return "#10b981";
}

/**
 * Draw detection boxes/masks without painting huge semi-opaque polygons
 * over half the photo (the "blue square" bug).
 */
export function DetectionOverlay({
  imageUrl,
  alt = "Detection",
  items,
  className = "",
}: {
  imageUrl: string;
  alt?: string;
  items: OverlayItem[];
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [nat, setNat] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setNat({ w: 0, h: 0 });
  }, [imageUrl]);

  const onLoad = () => {
    if (!imgRef.current) return;
    setNat({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
  };

  const imgArea = Math.max(1, nat.w * nat.h);

  return (
    <div className={`relative overflow-hidden bg-surface-container ${className}`}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        className="w-full h-auto block"
        onLoad={onLoad}
      />
      {nat.w > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${nat.w} ${nat.h}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {items.map((d, i) => {
            const color = severityColor(d);
            const polygon = d.bbox?.polygon;
            const boxArea = Math.max(1, (d.bbox?.width || 1) * (d.bbox?.height || 1));
            const allowFill = Boolean(polygon?.length) && boxArea / imgArea <= 0.18;
            const key = d.id ?? i;

            if (polygon?.length) {
              const pts = polygon.map((p) => `${p[0]},${p[1]}`).join(" ");
              return (
                <g key={key}>
                  <polygon
                    points={pts}
                    fill={allowFill ? `${color}33` : "none"}
                    stroke={color}
                    strokeWidth="2.5"
                  />
                  <rect
                    x={d.bbox.x}
                    y={d.bbox.y}
                    width={d.bbox.width}
                    height={d.bbox.height}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={allowFill ? undefined : "6 4"}
                  />
                </g>
              );
            }

            return (
              <rect
                key={key}
                x={d.bbox.x}
                y={d.bbox.y}
                width={d.bbox.width}
                height={d.bbox.height}
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
