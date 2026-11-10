// The SG monogram: a hairline circle with the initials. Drawn in SVG so it is
// identical in the home column, the top bar and the favicon.
export function SGMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" role="img" aria-label="Scott Grew">
      <circle cx="44" cy="44" r="43.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <text
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
    </svg>
  );
}
