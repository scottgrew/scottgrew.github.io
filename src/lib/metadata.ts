import type { Metadata } from "next";

export const siteUrl = "https://scott-grew.github.io";

export function buildTitle(pageTitle: string): string {
  return pageTitle === "Scott Grew" ? "Scott Grew" : `${pageTitle} — Scott Grew`;
}

export function buildMetadata(
  title: string,
  description: string,
  path = "/",
): Metadata {
  const fullTitle = buildTitle(title);
  const url = `${siteUrl}${path === "/" ? "/" : path}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Scott Grew",
      type: "website",
      images: [
        { url: "/opengraph-image", width: 1200, height: 630, alt: fullTitle },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/opengraph-image"],
    },
  };
}
