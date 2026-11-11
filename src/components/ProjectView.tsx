import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { projects, type Project } from "@/content/site";
import { Page } from "./Page";
import { ProjectMotif } from "./ProjectMotif";
import styles from "./ProjectView.module.css";

export function ProjectView({ project, readme }: { project: Project; readme: string }) {
  const index = projects.findIndex((p) => p.slug === project.slug);
  const previous = projects[index - 1];
  const next = projects[index + 1];

  return (
    <Page title={project.title} transitionName={`title-${project.slug}`} motif={<ProjectMotif slug={project.slug} />}>
      {project.demo ? (
        <figure className={styles.demo}>
          <video
            src={project.demo.src}
            width={project.demo.width}
            height={project.demo.height}
            aria-label={project.demo.label}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <figcaption>{project.demo.caption}</figcaption>
        </figure>
      ) : null}

      <div className={styles.readme}>
        <Markdown remarkPlugins={[remarkGfm]}>{readme}</Markdown>
      </div>

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
