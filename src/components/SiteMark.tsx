import styles from "./SiteMark.module.css";

// The site mark: ⊕, a hairline circle with a cross and an accent arc, drawn
// in SVG so it is identical everywhere it appears. It is the add of the skip
// connection on the home page (the cross spans the same share of the circle)
// and the symbol for XOR.
//
// With xor set (the top bar), hovering the mark flips it to the XOR problem:
// two classes on opposite corners, which no single straight line separates.
// The two dashed lines are the boundary a network with one hidden layer of
// two units draws: a band around one diagonal, the classic reason hidden
// layers exist. The points are drawn after the lines, on top of them.
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
      {/* Arms reach 25 of the circle's 43.5 radius, the home ⊕'s 4 of 7. */}
      <path className={styles.symbol} data-part="add" d="M 44 19 V 69 M 19 44 H 69" stroke="currentColor" strokeWidth="2.5" />
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
