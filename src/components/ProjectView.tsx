import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { projects, type Project } from "@/content/site";
import { MotionNetDiagram } from "./diagrams/MotionNetDiagram";
import { ThroughlineDiagram } from "./diagrams/ThroughlineDiagram";
import { Page } from "./Page";
import { ProjectMotif } from "./ProjectMotif";
import styles from "./ProjectView.module.css";

// The READMEs keep their exported diagram images (they render on GitHub);
// on the site each is swapped for a hand-drawn inline version in the site's
// faces and colours.
const DIAGRAMS: Record<string, React.ComponentType<{ label: string }>> = {
  "/media/diagrams/throughline.svg": ThroughlineDiagram,
  "/media/diagrams/motionnet.svg": MotionNetDiagram,
};

const README_COMPONENTS: Components = {
  // A paragraph holding only a diagram renders without the <p>, since the
  // diagram is a block.
  p: ({ node, children }) => {
    const only = node?.children.length === 1 ? node.children[0] : null;
    const src = only?.type === "element" && only.tagName === "img" ? String(only.properties.src ?? "") : "";
    return src in DIAGRAMS ? <>{children}</> : <p>{children}</p>;
  },
  img: ({ src, alt }) => {
    const Diagram = typeof src === "string" ? DIAGRAMS[src] : undefined;
    if (Diagram) return <Diagram label={alt ?? ""} />;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} />;
  },
};

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
        <Markdown remarkPlugins={[remarkGfm]} components={README_COMPONENTS}>
          {readme}
        </Markdown>
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
