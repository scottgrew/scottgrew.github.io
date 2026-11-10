import styles from "./SiteMark.module.css";

// The site mark: a robot's coordinate frame, the x/y/z axis triad every
// robotics viewer draws, in a hairline circle with an accent arc. It is drawn
// in SVG so it is identical everywhere it appears.
//
// The axes are in the usual isometric view of a right-handed frame: x toward
// the lower left, y toward the lower right, z up. Colours come from the
// background photo rather than the usual red, green and blue: the sunset
// accent for x, snow for y and the dusk sky for z.
const ORIGIN = [44, 50] as const;
const AXIS_LENGTH = 26;
const HEAD = 7; // arrowhead length
export const FRAME_AXES = [
  { name: "x", color: "#f29a4a", direction: [-Math.sqrt(3) / 2, 0.5] },
  { name: "y", color: "#e8ecf2", direction: [Math.sqrt(3) / 2, 0.5] },
  { name: "z", color: "#8fa9d4", direction: [0, -1] },
] as const;

// One axis: a line from the origin, ending in a filled arrowhead.
export function axisPaths(direction: readonly [number, number]) {
  const [ox, oy] = ORIGIN;
  const [dx, dy] = direction;
  const tipX = ox + dx * AXIS_LENGTH;
  const tipY = oy + dy * AXIS_LENGTH;
  const baseX = tipX - dx * HEAD;
  const baseY = tipY - dy * HEAD;
  const half = HEAD * 0.5; // half the arrowhead's width, across the axis
  const r = (n: number) => n.toFixed(1);
  return {
    line: `M ${ox} ${oy} L ${r(baseX)} ${r(baseY)}`,
    head: `M ${r(tipX)} ${r(tipY)} L ${r(baseX - dy * half)} ${r(baseY + dx * half)} L ${r(baseX + dy * half)} ${r(baseY - dx * half)} Z`,
  };
}

export function SiteMark({ size, xor = false }: { size: number; xor?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      role="img"
      aria-label="Scott Grew"
      className={xor ? styles.xor : undefined}
    >
      <circle cx="44" cy="44" r="43.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M 74.8 13.3 A 43.5 43.5 0 0 1 87.5 44" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <g className={styles.symbol} data-part="frame">
        {FRAME_AXES.map(({ name, color, direction }) => {
          const { line, head } = axisPaths(direction);
          return (
            <g key={name} data-axis={name}>
              <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
              <path d={head} fill={color} />
            </g>
          );
        })}
      </g>
      {xor ? (
        <g className={styles.problem}>
          {/* Both boundaries run parallel to the diagonal through the filled
              points, one on each side, so they fence that class in. */}
          <line x1="12" y1="26" x2="60" y2="74" className={styles.boundary} />
          <line x1="26" y1="12" x2="74" y2="60" className={styles.boundary} />
          <circle cx="30" cy="30" r="5" className={styles.classA} />
          <circle cx="58" cy="58" r="5" className={styles.classA} />
          <circle cx="58" cy="30" r="5" className={styles.classB} />
          <circle cx="30" cy="58" r="5" className={styles.classB} />
        </g>
      ) : null}
    </svg>
  );
}
