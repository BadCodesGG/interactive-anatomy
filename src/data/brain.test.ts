import { describe, expect, it } from "vitest";
import { partSections } from "@/engine/explode/ui/part-list";
import { brainSidecar } from "./brain";

describe("brain sidecar", () => {
  it("files every region under a labelled group, so the part list has no 'Other parts' heading", () => {
    const sections = partSections(brainSidecar);
    expect(sections.map((s) => s.label)).toEqual(["Brain regions"]);
    expect(sections[0].parts).toHaveLength(Object.keys(brainSidecar.parts).length);
  });
});
