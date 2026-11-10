type SGMarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function SGMark({ size = 88, className, title }: SGMarkProps) {
  const label = title ?? "Scott Grew";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      className={className}
      role="img"
      aria-label={label}
    >
      <circle
        cx="44"
        cy="44"
        r="43.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="44"
        y="44.5"
        textAnchor="middle"
        dominantBaseline="central"
        className="sgMarkText"
      >
        SG
      </text>
    </svg>
  );
}
