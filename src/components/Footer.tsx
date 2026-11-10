import { home } from "@/content/site";
import { SGMark } from "./SGMark";
import { SocialLink } from "./SocialLink";
import styles from "./Footer.module.css";

// Stamped when the site is built, so it is the date the deployed copy was made.
const UPDATED = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.sign}>
        <SGMark size={30} />
        <span>Updated {UPDATED}</span>
      </div>
      <ul className={styles.links}>
        {home.links.map((link) => (
          <li key={link.href}>
            <SocialLink link={link} arrow />
          </li>
        ))}
      </ul>
      <p className={styles.keys}>
        Press <kbd>?</kbd> for keyboard shortcuts
      </p>
    </footer>
  );
}
