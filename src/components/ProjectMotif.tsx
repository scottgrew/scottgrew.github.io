import { ClickEgg } from "./eggs/ClickEgg";
import { FuturesOverlay } from "./eggs/CursorFutures";
import { TrackerOverlay } from "./eggs/CursorTracker";
import styles from "./ProjectMotif.module.css";

// Throughline's and MotionNet's pages carry a small drawing of their idea next
// to the title (a lidar sweep, six predicted paths); the projects list shows
// every project's drawing, Glidepath's approach and Showdown's game tree too.

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

function GlideSlope() {
  // The approach: a 3 degree path down to the runway, a flare, and the
  // rollout along it; the flown path is drawn in the accent.
  return (
    <svg viewBox="0 0 240 150" className={styles.motif} aria-hidden="true" data-motif="glideslope">
      <path d="M 0 128 L 240 128" className={styles.faint} />
      <path d="M 120 128 L 232 128" className={styles.accent} style={{ strokeWidth: 3 }} />
      <path d="M 12 52 L 150 128" className={styles.faint} strokeDasharray="4 4" />
      <path d="M 12 52 L 116 110 Q 134 121 160 127 L 214 128" className={styles.accent} />
      <circle cx={12} cy={52} r={3} className={styles.dot} />
    </svg>
  );
}

function GameTree() {
  // A game tree: each node branches on the actions there; one line of play
  // through it is drawn in the accent.
  const nodes: [number, number][] = [
    [20, 75], [90, 32], [90, 75], [90, 118], [160, 18], [160, 46], [160, 104], [160, 132], [225, 36], [225, 56],
  ];
  const edges: [number, number, boolean][] = [
    [0, 1, true], [0, 2, false], [0, 3, false], [1, 4, false], [1, 5, true], [3, 6, false], [3, 7, false], [5, 8, false], [5, 9, true],
  ];
  return (
    <svg viewBox="0 0 240 150" className={styles.motif} aria-hidden="true" data-motif="tree">
      {edges.map(([a, b, hot]) => (
        <path
          key={`${a}-${b}`}
          d={`M ${nodes[a][0]} ${nodes[a][1]} L ${nodes[b][0]} ${nodes[b][1]}`}
          className={hot ? styles.accent : styles.faint}
        />
      ))}
      {nodes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} className={styles.node} />
      ))}
      <circle cx={20} cy={75} r={3} className={styles.dot} />
    </svg>
  );
}

// The drawing alone, without its easter egg, for the projects list: a click
// there opens the project.
export function ProjectDrawing({ slug }: { slug: string }) {
  if (slug === "throughline") return <LidarSweep />;
  if (slug === "motionnet") return <PathFan />;
  if (slug === "glidepath") return <GlideSlope />;
  if (slug === "showdown") return <GameTree />;
  return null;
}

export function ProjectMotif({ slug }: { slug: string }) {
  if (slug === "throughline") return <ClickEgg name="tracker" overlay={TrackerOverlay}><LidarSweep /></ClickEgg>;
  if (slug === "motionnet") return <ClickEgg name="futures" overlay={FuturesOverlay}><PathFan /></ClickEgg>;
  // The newer drawings are shaped for the projects list, not to sit beside a
  // page title.
  return null;
}
