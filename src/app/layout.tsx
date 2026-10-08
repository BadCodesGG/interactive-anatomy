import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import Link from "next/link";
import { changeNotice, credits, educationalDisclaimer, textNotice } from "@/data/credits";
import { ThemeToggle, themeScript } from "@/engine/explode";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

// Anatomy Atlas type: Cormorant for titles and every label on the plate, EB Garamond for reading.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${cormorant.variable} ${ebGaramond.variable}`} suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint, so a dark visitor never sees the light plate flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Base UI portals mount on <body>, outside this stacking context, so popups sit above the app. */}
        <div className="isolate flex flex-1 flex-col">
          <header className="border-b border-border py-2 short:py-1">
            {/* Header, page and footer share one box: max-w-6xl with the page's own padding, so their content edges line up. */}
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
              <Link href="/" className="font-display text-xl font-semibold text-ink underline-offset-4 hover:text-accent hover:underline">
                Anatomy, exploded
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border py-6 text-sm text-ink-tertiary">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between md:px-6">
              <p className="shrink-0">
                Built by{" "}
                <a href="https://badcodes.dev" className="text-ink-secondary underline-offset-4 hover:text-accent hover:underline">
                  badcodes.dev
                </a>
              </p>
              {credits.length > 0 && (
                <ul aria-label="Credits" className="flex flex-wrap gap-x-4 gap-y-2">
                  {credits.map((c) => (
                    <li key={c.label}>
                      {c.href ? (
                        <a href={c.href} className="underline-offset-4 hover:text-accent hover:underline" rel="noreferrer">
                          {c.label}
                        </a>
                      ) : (
                        c.label
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mx-auto mt-4 flex max-w-6xl flex-col gap-2 px-4 text-xs md:px-6">
              <p data-disclaimer>{educationalDisclaimer}</p>
              <p>{changeNotice}</p>
              <p>{textNotice}</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
