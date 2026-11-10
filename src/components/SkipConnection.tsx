"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SkipConnection.module.css";

type Metrics = {
  width: number;
  height: number;
  upperMidY: number;
  lowerMidY: number;
  boxTop: number;
  boxBottom: number;
  boxRight: number;
  columnCenterX: number;
};

type SkipConnectionProps = {
  upperLineRef: React.RefObject<HTMLDivElement | null>;
  lowerLineRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  columnRef: React.RefObject<HTMLDivElement | null>;
};

export function SkipConnection({
  upperLineRef,
  lowerLineRef,
  contentRef,
  columnRef,
}: SkipConnectionProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const measure = () => {
      const upper = upperLineRef.current;
      const lower = lowerLineRef.current;
      const box = contentRef.current;
      const column = columnRef.current;
      if (!upper || !lower || !box || !column) return;

      const colRect = column.getBoundingClientRect();
      const upperRect = upper.getBoundingClientRect();
      const lowerRect = lower.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();

      const extend = 24;
      setMetrics({
        width: column.clientWidth,
        height: column.clientHeight,
        upperMidY: upperRect.top + upperRect.height / 2 - colRect.top,
        lowerMidY: lowerRect.top + lowerRect.height / 2 - colRect.top,
        boxTop: boxRect.top - colRect.top,
        boxBottom: boxRect.bottom - colRect.top,
        boxRight: boxRect.right - colRect.left + extend,
        columnCenterX: upperRect.left + upperRect.width / 2 - colRect.left,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (columnRef.current) ro.observe(columnRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [columnRef, contentRef, lowerLineRef, upperLineRef]);

  if (!metrics) return null;

  const { width, height, upperMidY, lowerMidY, boxTop, boxBottom, boxRight, columnCenterX } =
    metrics;

  const path = `M ${columnCenterX} ${upperMidY} H ${boxRight} V ${boxBottom} H ${columnCenterX} V ${lowerMidY}`;

  return (
    <svg
      ref={svgRef}
      className={styles.skip}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path d={path} className={styles.path} />
      <circle
        cx={columnCenterX}
        cy={lowerMidY}
        r="7.2"
        className={styles.join}
      />
      <line
        x1={columnCenterX - 4}
        y1={lowerMidY}
        x2={columnCenterX + 4}
        y2={lowerMidY}
        className={styles.plusStroke}
      />
      <line
        x1={columnCenterX}
        y1={lowerMidY - 4}
        x2={columnCenterX}
        y2={lowerMidY + 4}
        className={styles.plusStroke}
      />
      <rect x={columnCenterX} y={boxTop} width={0} height={boxBottom - boxTop} fill="none" />
    </svg>
  );
}
