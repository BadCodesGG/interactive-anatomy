import { describe, expect, it, vi } from "vitest";
import { metadata as layout } from "@/app/layout";
import { metadata as body } from "@/app/body/page";
import { metadata as brain } from "@/app/brain/page";
import { metadata as home } from "@/app/page";
import { OG_IMAGE, SITE_NAME, SITE_TITLE, SITE_URL, pageMetadata, shareTitle } from "./site";

// next/font only works inside Next's compiler; the layout's metadata does not need it.
vi.mock("next/font/google", () => ({ Cormorant_Garamond: () => ({ variable: "" }), EB_Garamond: () => ({ variable: "" }) }));

const routes = [
  { name: "/", path: "/", metadata: home },
  { name: "/brain", path: "/brain", metadata: brain },
  { name: "/body", path: "/body", metadata: body },
];

describe("site", () => {
  it("SITE_URL is the https custom domain", () => {
    expect(SITE_URL).toBe("https://anatomy.badcodes.dev");
    expect(String(layout.metadataBase)).toBe(`${SITE_URL}/`);
  });

  it("the layout carries the image for routes with no metadata of their own", () => {
    expect(layout.openGraph?.images).toEqual([OG_IMAGE]);
    expect(layout.twitter?.images).toEqual([OG_IMAGE.url]);
  });

  it("the image is 1200x630 with alt text", () => {
    expect(OG_IMAGE).toMatchObject({ url: "/og.jpg", width: 1200, height: 630 });
    expect(OG_IMAGE.alt.length).toBeGreaterThan(20);
  });

  it("pageMetadata gives the route its own title, url and the image", () => {
    const m = pageMetadata({ title: "T", description: "D", path: "/x" });
    expect(m.openGraph).toMatchObject({ title: "T | Interactive", description: "D", url: "/x", images: [OG_IMAGE] });
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: [OG_IMAGE.url] });
    expect(m.alternates?.canonical).toBe("/x");
  });
  it("a card's title is the page's <title>: the root page as written, every other route with the suffix", () => {
    expect(shareTitle("T", "/")).toBe("T");
    expect(shareTitle("T", "/x")).toBe(`T | ${SITE_NAME}`);
  });

  it("the home page keeps the title it had before, brand included", () => {
    expect(home.title).toBe("Anatomy, exploded | Interactive");
    expect(SITE_TITLE).toBe(home.title);
  });

  describe.each(routes)("$name", ({ path, metadata }) => {
    it("carries the og image, its own url and a large twitter card", () => {
      expect(metadata.openGraph?.images).toEqual([OG_IMAGE]);
      expect(metadata.openGraph?.url).toBe(path);
      expect(metadata.twitter?.images).toEqual([OG_IMAGE.url]);
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
      expect(metadata.alternates?.canonical).toBe(path);
      expect(metadata.openGraph?.title).toBe(shareTitle(metadata.title as string, path));
      expect(metadata.twitter?.title).toBe(metadata.openGraph?.title);
    });
  });
});
