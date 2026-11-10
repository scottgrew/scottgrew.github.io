import Image from "next/image";
import type { Project, ProjectSection } from "@/content/site";
import styles from "./ProjectSections.module.css";

function SectionBlock({ section }: { section: ProjectSection }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{section.heading}</h3>
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 32)} className={styles.paragraph}>
          {p}
        </p>
      ))}
      {section.items?.map((item) => (
        <p key={item.title} className={styles.item}>
          <span className={styles.itemTitle}>{item.title}</span> {item.body}
        </p>
      ))}
      {section.table ? (
        <>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} mono`}>
              <thead>
                <tr>
                  {section.table.head.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row) => (
                  <tr key={row.join("-")}>
                    {row.map((cell, i) => (
                      <td key={`${row[0]}-${i}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.table.caption ? (
            <p className={styles.caption}>{section.table.caption}</p>
          ) : null}
        </>
      ) : null}
      {section.trailingParagraphs?.map((p) => (
        <p key={`t-${p.slice(0, 32)}`} className={styles.paragraph}>
          {p}
        </p>
      ))}
      {section.commands ? (
        <>
          <div className={`${styles.commands} mono`}>
            {section.commands.map((cmd) => (
              <div key={cmd}>{cmd}</div>
            ))}
          </div>
          {section.after ? <p className={styles.paragraph}>{section.after}</p> : null}
        </>
      ) : null}
    </section>
  );
}

export function ProjectDetail({ project }: { project: Project }) {
  return (
    <article>
      <p className={`${styles.stack} mono`}>{project.stack}</p>
      <p className={styles.summary}>{project.summary}</p>
      {project.demo ? (
        <figure className={styles.demo}>
          <Image
            src={project.demo.src}
            alt={project.demo.alt}
            width={1200}
            height={675}
            unoptimized
          />
          <figcaption className={styles.demoCaption}>{project.demo.caption}</figcaption>
        </figure>
      ) : null}
      {project.sections.map((section) => (
        <SectionBlock key={section.heading} section={section} />
      ))}
    </article>
  );
}
