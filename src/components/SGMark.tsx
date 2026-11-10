import styles from "./SGMark.module.css";

// The SG monogram: a hairline circle with the initials and an accent arc,
// drawn in SVG so it is identical everywhere it appears.
//
// With xor set (the top bar), hovering the mark flips it to the XOR problem:
// two classes on opposite corners, which no single straight line separates.
// The two dashed lines are the boundary a network with one hidden layer of
// two units draws, the classic reason hidden layers exist.
export function SGMark({ size, xor = false }: { size: number; xor?: boolean }) {
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
      <text
        className={styles.initials}
        x="44"
        y="45"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="var(--font-sans-family)"
        fontWeight="600"
        fontSize="22"
        letterSpacing="3"
      >
        SG
      </text>
      {xor ? (
        <g className={styles.problem}>
          <line x1="16" y1="44" x2="44" y2="16" className={styles.boundary} />
          <line x1="44" y1="72" x2="72" y2="44" className={styles.boundary} />
          <circle cx="30" cy="30" r="5" className={styles.classA} />
          <circle cx="58" cy="58" r="5" className={styles.classA} />
          <circle cx="58" cy="30" r="5" className={styles.classB} />
          <circle cx="30" cy="58" r="5" className={styles.classB} />
        </g>
      ) : null}
    </svg>
  );
}
