import { notFound } from "next/navigation";
import { InnerPanel } from "@/components/InnerPanel";
import { LinkButton } from "@/components/LinkButton";
import { ProjectDetail } from "@/components/ProjectSections";
import { ProjectPager } from "@/components/ProjectPager";
import { getProject, projects } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return buildMetadata(project.title, project.summary, `/${slug}/`);
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <InnerPanel
      title={project.title}
      links={project.links.map((link) => (
        <LinkButton key={link.href} href={link.href} external>
          {link.label}
        </LinkButton>
      ))}
      footer={<ProjectPager project={project} />}
    >
      <ProjectDetail project={project} />
    </InnerPanel>
  );
}
