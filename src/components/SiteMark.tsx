import styles from "./SiteMark.module.css";

// The site mark: a tetrahedron, the solid Plato's Timaeus assigns to fire,
// in a hairline circle with an accent arc. It is drawn as a wireframe with
// the hidden back edge dashed, the way a 3D viewer draws one, and in SVG so
// it is identical everywhere it appears.
export const TETRAHEDRON = {
  edges: "M 44 16 L 21 58 L 49 71 Z M 44 16 L 67 57 L 49 71", // the five visible edges
  hidden: "M 21 58 L 67 57", // the back edge, behind the front face
  apex: [44, 16] as const,
};

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
      {/* Ring and arc share r=42 so the arc sits on the ring, inset enough
          that neither stroke is clipped by the viewBox at small sizes. */}
      <circle cx="44" cy="44" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 73.7 14.3 A 42 42 0 0 1 86 44" fill="none" stroke="var(--accent)" strokeWidth="3" />
      <g className={styles.symbol} data-part="tetrahedron">
        <path d={TETRAHEDRON.edges} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={TETRAHEDRON.hidden} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx={TETRAHEDRON.apex[0]} cy={TETRAHEDRON.apex[1]} r="2.4" fill="var(--accent)" />
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
