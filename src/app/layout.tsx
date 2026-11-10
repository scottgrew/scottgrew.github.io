import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Background } from "@/components/Background";
import { SiteFrame } from "@/components/SiteFrame";
import { home } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

// The display face for the name and page titles: Archivo's variable width
// axis at its widest, in ExtraBold. Plex stays for everything else.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Static hosting cannot send headers, so the policy rides in a meta tag.
// 'unsafe-inline' scripts are needed for Next's inline bootstrap; a
// hash-based policy replaces it before launch.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export const metadata: Metadata = buildMetadata(home.name, home.subtitle);

export const viewport: Viewport = { themeColor: "#1b1f22" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${archivo.variable}`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <noscript>
          <style>{`.bg-root{background-image:url("/media/background.jpg")}.bg-root canvas{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <Background />
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
