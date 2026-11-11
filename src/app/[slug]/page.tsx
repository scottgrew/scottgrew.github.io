import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/ProjectView";
import { getProject, projects } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const project = getProject((await params).slug);
  return project ? buildMetadata(project.title, project.summary, `/${project.slug}/`) : {};
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  // Read at build time; the site is a static export.
  const readme = readFileSync(join(process.cwd(), "src/content/readmes", `${project.slug}.md`), "utf8");
  return <ProjectView project={project} readme={readme} />;
}
