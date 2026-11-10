import Link from "next/link";
import type { Project } from "@/content/site";
import { getProject, projectOrder } from "@/content/site";
import styles from "./ProjectPager.module.css";

export function ProjectPager({ project }: { project: Project }) {
  const idx = projectOrder.indexOf(project.slug);
  const prevSlug = idx > 0 ? projectOrder[idx - 1] : null;
  const nextSlug = idx < projectOrder.length - 1 ? projectOrder[idx + 1] : null;

  return (
    <nav className={styles.pager} aria-label="Project navigation">
      {prevSlug ? (
        <Link href={`/${prevSlug}/`} className={styles.pagerLink}>
          ← Previous{" "}
          <span className={styles.sub}>{getProject(prevSlug)?.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {nextSlug ? (
        <Link href={`/${nextSlug}/`} className={styles.pagerLink}>
          Next →{" "}
          <span className={styles.sub}>{getProject(nextSlug)?.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
