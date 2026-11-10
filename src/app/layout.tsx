import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from "next/font/google";
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

// The display face for the name and page titles: Syne ExtraBold, heavy
// enough to stay legible when the name is broken into a point cloud. Plex
// stays for everything else. Scott picked it from a specimen, 2026-11-09.
const syne = Syne({
  weight: ["800"],
  subsets: ["latin"],
  variable: "--font-syne",
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
  // The contact form posts to Web3Forms; nothing else leaves the site.
  "connect-src 'self' https://api.web3forms.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export const metadata: Metadata = buildMetadata(home.name, home.subtitle);

export const viewport: Viewport = { themeColor: "#1b1f22" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${syne.variable}`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <noscript>
          <style>{`.bg-root{background-image:url("/media/background.jpg")}.bg-root canvas{display:none}[data-intro] [class*="step"],div[data-intro]{opacity:1!important}`}</style>
        </noscript>
      </head>
      <body>
        <Background />
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
