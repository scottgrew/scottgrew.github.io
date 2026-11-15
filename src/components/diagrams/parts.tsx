import styles from "./Diagram.module.css";

// Shared pieces for the hand-drawn README diagrams. Text is set in the
// site's own faces and colours, so the diagrams read as part of the page.

const PAD_TOP = 12;
const PAD_BOTTOM = 10;
const LINE = 18;
const FIRST_BASELINE = 13;

export function nodeHeight(lines: number): number {
  return PAD_TOP + LINE * lines + PAD_BOTTOM;
}

// A box centred on x with its top at y. The first line is the name of the
// step; any further lines say what it does.
export function Node({
  x,
  y,
  w,
  lines,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  lines: readonly string[];
  accent?: boolean;
}) {
  const h = nodeHeight(lines.length);
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} className={accent ? styles.boxAccent : styles.box} />
      {lines.map((line, i) => (
        <text
          key={line}
          x={x}
          y={y + PAD_TOP + FIRST_BASELINE + LINE * i}
          textAnchor="middle"
          className={i === 0 ? styles.title : styles.sub}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// A dashed frame around steps that belong together, labelled inside its
// top-left corner so the label never crosses the border.
export function Group({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className={styles.group} />
      <text x={x + 12} y={y + 18} className={styles.groupLabel}>
        {label}
      </text>
    </g>
  );
}

export function Edge({ d, marker, accent = false }: { d: string; marker: string; accent?: boolean }) {
  return <path d={d} className={accent ? styles.edgeAccent : styles.edge} markerEnd={`url(#${marker})`} />;
}

export function Arrowheads({ id }: { id: string }) {
  return (
    <defs>
      <marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 Z" className={styles.head} />
      </marker>
      <marker id={`${id}-arrow-accent`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 Z" className={styles.headAccent} />
      </marker>
    </defs>
  );
}
