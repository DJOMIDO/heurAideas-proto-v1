// frontend/src/pages/overview/StatusBar.tsx

import { type Step, type Substep } from "@/data/steps";

interface StatusBarProps {
  step: Step;
  substep?: Substep;
}

export default function StatusBar({ step, substep }: StatusBarProps) {
  return (
    <div className="border-b border-[#A3B18A]/50 p-4 bg-background shrink-0 min-h-24 flex flex-col justify-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3A5A40]">Current focus</p>
      <h2 className="text-xl font-bold tracking-tight text-foreground mt-1 sm:text-2xl">
        {substep
          ? `Substep ${substep.id} : ${substep.title}`
          : `Step ${step.id} : ${step.title}`}
      </h2>
    </div>
  );
}
