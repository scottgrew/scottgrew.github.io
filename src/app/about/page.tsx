import { InnerPanel } from "@/components/InnerPanel";
import { LinkButton } from "@/components/LinkButton";
import { about } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import styles from "./about.module.css";

export const metadata = buildMetadata(
  about.title,
  about.paragraphs[0],
  "/about/",
);

export default function AboutPage() {
  return (
    <InnerPanel
      title={about.title}
      links={about.links.map((link) => (
        <LinkButton key={link.href} href={link.href} external>
          {link.label}
        </LinkButton>
      ))}
    >
      <div className={styles.content}>
        {about.paragraphs.map((p) => (
          <p key={p.slice(0, 32)} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </div>
    </InnerPanel>
  );
}
