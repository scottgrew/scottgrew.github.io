import Link from "next/link";
import { Page } from "@/components/Page";
import { ProjectDrawing } from "@/components/ProjectMotif";
import { projects, projectsPage } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import styles from "./projects.module.css";

export const metadata = buildMetadata(projectsPage.title, projectsPage.description, "/projects/");

// One row per project. Each row's title carries the view-transition name of
// that project page's title, so it grows into the page when opened.
export default function ProjectsPage() {
  return (
    <Page title={projectsPage.title} transitionName="title-projects">
      <ul className={styles.list}>
        {projects.map((project) => (
          <li key={project.slug} className={styles.item}>
            <Link href={`/${project.slug}/`} className={styles.card}>
              <div className={styles.drawing} aria-hidden="true">
                <ProjectDrawing slug={project.slug} />
              </div>
              <div>
                <h2 className={styles.title} style={{ viewTransitionName: `title-${project.slug}` }}>
                  {project.title}
                </h2>
                <p className={styles.summary}>{project.summary}</p>
                <span className={styles.hint}>View project →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
