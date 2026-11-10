import styles from "./Page.module.css";

// The column every non-home page writes into, directly on the scene.
export function Page({
  label,
  title,
  lede,
  children,
}: {
  label?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={styles.page}>
      {label ? <p className={styles.label}>{label}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
      <div className={styles.body}>{children}</div>
    </main>
  );
}
