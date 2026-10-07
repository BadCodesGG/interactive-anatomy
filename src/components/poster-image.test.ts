import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { darkPoster, PosterImage, posterVariant } from "./poster-image";

const html = (props: Parameters<typeof PosterImage>[0]) => renderToStaticMarkup(createElement(PosterImage, props));
const imgs = (markup: string) => markup.match(/<img [^>]*>/g) ?? [];
const preloads = (markup: string) => markup.match(/<link [^>]*rel="preload"[^>]*>/g) ?? [];

describe("poster names", () => {
  it("names the night twin of a still", () => {
    expect(darkPoster("/posters/body.png")).toBe("/posters/body-dark.png");
  });

  it("names the stage's cuts, and their night twins", () => {
    expect(posterVariant("/posters/body.png", "stage")).toBe("/posters/body-stage.png");
    expect(darkPoster(posterVariant("/posters/body.png", "portrait"))).toBe("/posters/body-portrait-dark.png");
  });
});

describe("PosterImage fetching", () => {
  it("makes both themes' stills lazy, so a browser fetches only the one on screen, and gives them priority", () => {
    const markup = html({ src: "/posters/body.png", alt: "x" });
    const found = imgs(markup);
    expect(found).toHaveLength(2);
    for (const img of found) {
      expect(img).toContain('loading="lazy"');
      expect(img).toContain('fetchPriority="high"');
    }
    expect(found[0]).toContain("dark:hidden");
    expect(found[1]).toContain("hidden dark:block");
  });

  it("preloads the still for the visitor's system theme, by media query", () => {
    const found = preloads(html({ src: "/posters/body.png", alt: "x" }));
    expect(found).toHaveLength(2);
    expect(found.find((l) => l.includes("prefers-color-scheme: dark"))).toContain("body-dark.png");
    const light = found.find((l) => l.includes("prefers-color-scheme: light"))!;
    expect(light).toContain("body.png");
    expect(light).not.toContain("dark.png");
  });

  it("preloads each viewport's cut of each theme on the stage, so a phone and a desktop fetch their own", () => {
    const found = preloads(html({ src: "/posters/body.png", alt: "x", stage: true }));
    expect(found).toHaveLength(4);
    const phone = found.filter((l) => l.includes("max-width: 767.98px"));
    expect(phone).toHaveLength(2);
    for (const l of phone) expect(l).toContain("portrait");
    for (const l of found.filter((l) => l.includes("min-width: 767.99px"))) expect(l).toContain("body-stage");
  });

  it("asks for nothing early when it is not eager (the chooser's cards, below the fold)", () => {
    const markup = html({ src: "/posters/brain.png", alt: "x", eager: false });
    expect(preloads(markup)).toHaveLength(0);
    for (const img of imgs(markup)) {
      expect(img).toContain('loading="lazy"');
      expect(img).not.toContain("fetchPriority");
    }
  });
});
