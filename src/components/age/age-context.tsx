"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useExplodeStore } from "@/engine/explode";
import { ageLooks, DEFAULT_AGE_STAGE } from "@/lib/age-looks";

interface AgeContextValue {
  stage: number;
  setStage: (stage: number) => void;
}

const AgeContext = createContext<AgeContextValue | null>(null);

/**
 * The body view's age stage. Every change becomes engine looks (scales and tints) in the explode
 * store; the canvas tweens toward them per frame, outside React. Must sit inside <ExplodeProvider>.
 */
export function AgeProvider({ groups, children }: { groups: string[]; children: ReactNode }) {
  const store = useExplodeStore();
  const [stage, setStage] = useState(DEFAULT_AGE_STAGE);
  useEffect(() => {
    store.setLooks(ageLooks(stage, groups));
  }, [store, stage, groups]);
  return <AgeContext value={{ stage, setStage }}>{children}</AgeContext>;
}

export function useAge(): AgeContextValue {
  const v = use(AgeContext);
  if (!v) throw new Error("useAge must be used inside <AgeProvider>");
  return v;
}
