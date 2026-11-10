import Link from "next/link";
import styles from "./LinkButton.module.css";

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
};

export function LinkButton({
  href,
  children,
  className,
  external,
}: LinkButtonProps) {
  const rel = external ? "noopener noreferrer" : undefined;
  const target = external ? "_blank" : undefined;

  return (
    <Link
      href={href}
      className={[styles.button, className].filter(Boolean).join(" ")}
      rel={rel}
      target={target}
    >
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
