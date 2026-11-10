"use client";

import { useEffect, useState } from "react";
import styles from "./SkipConnection.module.css";

type Geometry = { width: number; height: number; x: number; top: number; bottom: number; right: number };

// Easter egg: a residual "skip connection" drawn around the name box. It
// leaves the upper connector line, runs past the box's right edge, and adds
// back into the lower connector line at the ⊕, the way a ResNet block adds
// its input to its output.
export function SkipConnection({
  column,
  upper,
  lower,
  box,
}: {
  column: React.RefObject<HTMLDivElement | null>;
  upper: React.RefObject<HTMLDivElement | null>;
  lower: React.RefObject<HTMLDivElement | null>;
  box: React.RefObject<HTMLDivElement | null>;
}) {
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  useEffect(() => {
    // Offsets come from layout, so the entrance animation (which scales the
    // connector lines from zero) cannot skew the measurement.
    const measure = () => {
      const c = column.current;
      const u = upper.current;
      const l = lower.current;
      const b = box.current;
      if (!c || !u || !l || !b) return;
      setGeometry({
        width: c.offsetWidth,
        height: c.offsetHeight,
        x: u.offsetLeft + u.offsetWidth / 2,
        top: u.offsetTop + u.offsetHeight / 2,
        bottom: l.offsetTop + l.offsetHeight / 2,
        right: b.offsetLeft + b.offsetWidth + 24,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (column.current) observer.observe(column.current);
    return () => observer.disconnect();
  }, [column, upper, lower, box]);

  if (!geometry) return null;
  const { width, height, x, top, bottom, right } = geometry;
  const join = 7;

  return (
    <svg className={styles.skip} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className={styles.path} d={`M ${x} ${top} H ${right} V ${bottom} H ${x + join}`} />
      <circle className={styles.join} cx={x} cy={bottom} r={join} />
      <path className={styles.join} d={`M ${x - 4} ${bottom} H ${x + 4} M ${x} ${bottom - 4} V ${bottom + 4}`} />
    </svg>
  );
}
