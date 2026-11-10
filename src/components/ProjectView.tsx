import Link from "next/link";
import { projects, type Project } from "@/content/site";
import { Page } from "./Page";
import styles from "./ProjectView.module.css";

export function ProjectView({ project }: { project: Project }) {
  const index = projects.findIndex((p) => p.slug === project.slug);
  const previous = projects[index - 1];
  const next = projects[index + 1];

  return (
    <Page label={project.stack} title={project.title}>
      {project.demo ? (
        <figure className={styles.demo}>
          {/* A GIF in a static export: next/image would add nothing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.demo.src} alt={project.demo.alt} decoding="async" />
          <figcaption>{project.demo.caption}</figcaption>
        </figure>
      ) : null}

      {project.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <a className={styles.code} href={project.code} rel="noopener noreferrer" target="_blank">
        GitHub ↗
      </a>

      <nav className={styles.pager} aria-label="More projects">
        {previous ? (
          <Link href={`/${previous.slug}/`} className={styles.pagerLink}>
            <span className={styles.pagerHint}>← Previous</span>
            <span className={styles.pagerTitle}>{previous.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link href={`/${next.slug}/`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
            <span className={styles.pagerHint}>Next →</span>
            <span className={styles.pagerTitle}>{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </Page>
  );
}
