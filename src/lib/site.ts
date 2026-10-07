import type { Metadata } from "next";

/** The production custom domain, a literal: a relative or deployment URL makes Slack and Facebook drop the image. */
export const SITE_URL = "https://anatomy.badcodes.dev";

/** The brand every route's title ends with, shared with the f1 and pc sites. */
export const SITE_NAME = "Interactive";

/** The home page's title. The root page is not run through the layout's template, so it is spelled out. */
export const SITE_TITLE = `Anatomy, exploded | ${SITE_NAME}`;

export const SITE_DESCRIPTION =
  "Interactive exploded views of the human brain and body: pull them apart in 3D, pick any part, and read what it does and why it matters.";

export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "An exploded human brain in 3D, its lobes and inner structures pulled apart above a grid floor.",
};

/**
 * The title a card shows, which is the page's own `<title>`. The layout's template
 * (`%s | ${SITE_NAME}`) applies to every route below the root but never to the root page, and
 * og:title and twitter:title never go through it, so the suffix is added here.
 */
export function shareTitle(title: string, path: string): string {
  return path === "/" ? title : `${title} | ${SITE_NAME}`;
}

/**
 * Metadata for one route. Next replaces a layout's `openGraph` and `twitter` wholesale when a route
 * declares its own, so a route that set only its title would otherwise lose the image or carry the
 * layout's title and url. Every route that sets metadata spreads this.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const card = shareTitle(title, path);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, title: card, description, url: path, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: card, description, images: [OG_IMAGE.url] },
  };
}
