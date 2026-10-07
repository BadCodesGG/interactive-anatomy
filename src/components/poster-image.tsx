import { preload } from "react-dom";
import { getImageProps } from "next/image";

/** `/posters/body.png` has a night twin, `/posters/body-dark.png` (npm run posters writes both). */
export const darkPoster = (src: string) => src.replace(/\.png$/, "-dark.png");

/**
 * The feature pages' stills are cut to the stage, not to the 3:2 card the chooser uses:
 * `/posters/body-stage.png` for the desktop plate and `/posters/body-portrait.png` for a phone's
 * (npm run posters writes both, in both themes). A 3:2 still in either would be cropped sideways,
 * which drops the leader labels or runs their lines off the edge.
 */
export const posterVariant = (src: string, variant: "stage" | "portrait") => src.replace(/\.png$/, `-${variant}.png`);

/** The media query of the page's phone layout (Tailwind's max-md), and of everything wider. */
const PHONE = "(max-width: 767.98px)";
const DESKTOP = "(min-width: 767.99px)";
/** What the visitor's system asks for, which is the theme unless they have toggled it by hand. */
const SYSTEM = { light: "(prefers-color-scheme: light)", dark: "(prefers-color-scheme: dark)" } as const;

/**
 * A captured still of the assembled model (npm run posters), shown until the 3D view draws and
 * instead of it when WebGL 2 is missing or the visitor has not opted in under reduced motion.
 *
 * Both themes' stills are in the markup and CSS shows the one for the page's theme (the `data-theme`
 * the head script sets before first paint), so the choice follows the theme toggle without JavaScript.
 * Both are lazy: a browser does not fetch an image that is not displayed, so only the still for the
 * theme on screen is fetched, and it is fetched at high priority (`eager`, the default). A lazy image
 * is only discovered once the page has laid out, so the still for the visitor's system theme is also
 * preloaded, by media query, at the same priority: the one a visitor who has not toggled the theme
 * will see starts downloading with the HTML. A visitor whose toggle disagrees with their system gets
 * the other still a little later and a wasted preload, which is rare. With `stage`, each theme's
 * still is a <picture> that swaps the desktop still for the portrait one on a phone, so a phone
 * fetches only its own.
 */
export function PosterImage({ src, alt, sizes = "(min-width: 768px) 780px, 100vw", eager = true, stage = false }: { src: string; alt: string; sizes?: string; eager?: boolean; stage?: boolean }) {
  const still = (path: string, night: boolean, viewport?: string) => {
    const props = getImageProps({ src: path, alt, fill: true, sizes, loading: "lazy", fetchPriority: eager ? "high" : undefined, className: `object-cover ${night ? "hidden dark:block" : "dark:hidden"}` }).props;
    if (eager) {
      const media = SYSTEM[night ? "dark" : "light"];
      preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: "high", media: viewport ? `${media} and ${viewport}` : media });
    }
    return props;
  };
  return (
    <>
      {[false, true].map((night) => {
        const pick = (p: string) => (night ? darkPoster(p) : p);
        if (!stage) {
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- getImageProps returns the alt it was given
          return <img key={String(night)} {...still(pick(src), night)} />;
        }
        const { srcSet, sizes: portraitSizes } = still(pick(posterVariant(src, "portrait")), night, PHONE);
        return (
          <picture key={String(night)}>
            <source media={PHONE} srcSet={srcSet} sizes={portraitSizes} />
            {/* eslint-disable-next-line jsx-a11y/alt-text -- getImageProps returns the alt it was given */}
            <img {...still(pick(posterVariant(src, "stage")), night, DESKTOP)} />
          </picture>
        );
      })}
    </>
  );
}
