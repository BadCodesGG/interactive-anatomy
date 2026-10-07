import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PosterImage } from "@/components/poster-image";
import { bodyPartCount } from "@/data/body";
import { SITE_DESCRIPTION, SITE_TITLE, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" });

const VIEWS = [
  {
    href: "/brain",
    title: "Brain",
    poster: "/posters/brain.png",
    alt: "The assembled brain model, coloured by region",
    text: "Fifteen regions, from the lobes of the cortex to the hippocampus and brainstem. Pull them apart and read what each one does.",
  },
  {
    href: "/body",
    title: "Body",
    poster: "/posters/body.png",
    alt: "The assembled body model: skeleton with organs inside",
    text: `The skeleton, the organs and the lymphoid tissue in ${bodyPartCount} parts, with an age slider from infant to senior.`,
  },
];

/** The chooser: two exploded views of the same open anatomy atlas. */
export default function Page() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Anatomy, exploded</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Take a human apart</h1>
        <p className="mt-4 text-base text-ink-secondary">
          Two interactive 3D models built from the open Z-Anatomy atlas. Drag a slider to pull the parts away from each other, pick
          any part to read what it does, and on the body, scrub through a lifetime.
        </p>
      </header>
      <ul className="grid gap-6 md:grid-cols-2">
        {VIEWS.map((v) => (
          <li key={v.href}>
            <Link
              href={v.href}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="relative aspect-[3/2] w-full bg-bg">
                <PosterImage src={v.poster} alt={v.alt} sizes="(min-width: 768px) 560px, 100vw" eager={false} />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
                  {v.title}
                  <ArrowRight aria-hidden="true" className="size-5 text-accent transition-transform group-hover:translate-x-1" />
                </h2>
                <p className="text-sm text-ink-secondary">{v.text}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
