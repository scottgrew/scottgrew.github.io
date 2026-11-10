import styles from "./ProjectMotif.module.css";

// Each project page carries a small drawing of its own idea next to the
// title: Throughline's lidar sweep, MotionNet's six predicted paths, and
// Showdown's game tree with the chosen line lit.

function LidarSweep() {
  const rings = [22, 44, 66, 88, 110];
  // Returns scattered on the rings, as a lidar scan sees them.
  const returns = [
    [44, 210], [44, 250], [66, 195], [66, 232], [66, 300], [88, 205], [88, 268],
    [88, 318], [110, 220], [110, 246], [110, 285], [22, 260],
  ];
  return (
    <svg viewBox="0 0 240 150" className={styles.motif} aria-hidden="true" data-motif="lidar">
      <g transform="translate(200 120)">
        {rings.map((r) => (
          <circle key={r} r={r} className={styles.faint} />
        ))}
        {returns.map(([r, deg]) => {
          const a = (deg * Math.PI) / 180;
          return <circle key={`${r}-${deg}`} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={1.6} className={styles.point} />;
        })}
        <g className={styles.sweep}>
          <path d="M 0 0 L 110 0 A 110 110 0 0 0 95.3 -55 Z" className={styles.wedge} />
          <line x1="0" y1="0" x2="110" y2="0" className={styles.accent} />
        </g>
        <circle r={3} className={styles.dot} />
      </g>
    </svg>
  );
}

function PathFan() {
  // Six predicted endings, likeliest first; the likeliest is drawn in the accent.
  const ends = [
    { y: 64, p: 1 },
    { y: 30, p: 0.6 },
    { y: 98, p: 0.45 },
    { y: 12, p: 0.32 },
    { y: 122, p: 0.24 },
    { y: 140, p: 0.16 },
  ];
  return (
    <svg viewBox="0 0 240 150" className={styles.motif} aria-hidden="true" data-motif="fan">
      {ends.map(({ y, p }, i) => (
        <path
          key={y}
          d={`M 10 120 C 90 120, 140 ${(120 + y) / 2}, 230 ${y}`}
          className={i === 0 ? styles.accentDraw : styles.faintDraw}
          style={{ opacity: i === 0 ? 1 : p, animationDelay: `${0.4 + i * 0.12}s` }}
          pathLength={1}
        />
      ))}
      <circle cx={10} cy={120} r={3} className={styles.dot} />
    </svg>
  );
}

function GameTree() {
  // Root, then fold / call / raise, then a second decision under call and raise.
  const root = { x: 120, y: 14 };
  const actions = [
    { x: 40, y: 72 },
    { x: 120, y: 72 },
    { x: 200, y: 72 },
  ];
  const leaves = [
    { from: 1, x: 95 }, { from: 1, x: 145 },
    { from: 2, x: 170 }, { from: 2, x: 200 }, { from: 2, x: 230 },
  ];
  const chosen = { action: 2, leaf: 3 };
  return (
    <svg viewBox="0 0 240 150" className={styles.motif} aria-hidden="true" data-motif="tree">
      {actions.map((a, i) => (
        <line key={i} x1={root.x} y1={root.y} x2={a.x} y2={a.y} className={i === chosen.action ? styles.accent : styles.faint} />
      ))}
      {leaves.map((leaf, i) => (
        <line
          key={i}
          x1={actions[leaf.from].x}
          y1={actions[leaf.from].y}
          x2={leaf.x}
          y2={130}
          className={i === chosen.leaf ? styles.accent : styles.faint}
        />
      ))}
      {[root, ...actions].map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={3} className={styles.node} />
      ))}
      {leaves.map((leaf, i) => (
        <circle key={i} cx={leaf.x} cy={130} r={2.2} className={i === chosen.leaf ? styles.dot : styles.node} />
      ))}
    </svg>
  );
}

export function ProjectMotif({ slug }: { slug: string }) {
  if (slug === "throughline") return <LidarSweep />;
  if (slug === "motionnet") return <PathFan />;
  if (slug === "showdown") return <GameTree />;
  return null;
}
