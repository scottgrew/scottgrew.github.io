import { Footer } from "./Footer";
import styles from "./Page.module.css";

// The column every non-home page writes into, directly on the scene. The
// title carries a view-transition name shared with its nav button, so it
// grows out of the button when the page opens.
export function Page({
  title,
  transitionName,
  lede,
  motif,
  children,
}: {
  title: string;
  transitionName?: string;
  lede?: string;
  motif?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title} style={transitionName ? { viewTransitionName: transitionName } : undefined}>
          {title}
        </h1>
        {motif ? <div className={styles.motif}>{motif}</div> : null}
      </header>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
      <div className={styles.body}>{children}</div>
      <Footer />
    </main>
  );
}
