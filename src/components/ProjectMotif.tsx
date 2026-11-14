import { ClickEgg } from "./eggs/ClickEgg";
import { FuturesOverlay } from "./eggs/CursorFutures";
import { TrackerOverlay } from "./eggs/CursorTracker";
import styles from "./ProjectMotif.module.css";

// Each project page carries a small drawing of its own idea next to the
// title: Throughline's lidar sweep and MotionNet's six predicted paths.

function LidarSweep() {
  const rings = [22, 44, 66, 88, 110];
  // Returns scattered on the rings, as a lidar scan sees them.
  const returns = [
    [44, 210], [44, 250], [66, 195], [66, 232], [66, 300], [88, 205], [88, 268],
    [88, 318], [110, 220], [110, 246], [110, 285], [22, 260],
  ];
  return (
    <svg viewBox="0 0 240 150" className={styles.motif} aria-hidden="true" data-motif="lidar">
      {/* Drawn at 81% so the rings sit lighter against the title. */}
      <g transform="translate(200 120) scale(0.81)">
        {rings.map((r) => (
          <circle key={r} r={r} className={styles.faint} />
        ))}
        {returns.map(([r, deg]) => {
          const a = (deg * Math.PI) / 180;
          return <circle key={`${r}-${deg}`} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={1.6} className={styles.point} />;
        })}
        {/* The sweep points up and to the right at 45° (the first quadrant),
            never parallel to the title rule; its wedge trails above it. */}
        <g transform="rotate(-45)">
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
          className={i === 0 ? styles.accent : styles.faint}
          style={{ opacity: i === 0 ? 1 : p }}
        />
      ))}
      <circle cx={10} cy={120} r={3} className={styles.dot} />
    </svg>
  );
}

export function ProjectMotif({ slug }: { slug: string }) {
  if (slug === "throughline") return <ClickEgg name="tracker" overlay={TrackerOverlay}><LidarSweep /></ClickEgg>;
  if (slug === "motionnet") return <ClickEgg name="futures" overlay={FuturesOverlay}><PathFan /></ClickEgg>;
  return null;
}
