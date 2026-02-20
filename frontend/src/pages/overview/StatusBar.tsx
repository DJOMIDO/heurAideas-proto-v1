import { type Step, type Substep } from "@/data/steps";

interface StatusBarProps {
  step: Step;
  substep?: Substep;
}

export default function StatusBar({ step, substep }: StatusBarProps) {
  return (
    <div className="border-b border-gray-200 p-4 bg-white shrink-0 h-24 flex flex-col justify-center">
      <h1 className="text-lg font-medium text-gray-600">Status here</h1>
      <h2 className="text-2xl font-bold mt-1">
        {substep
          ? `Substep ${substep.id} : ${substep.title}`
          : `Step ${step.id} : ${step.title}`}
      </h2>
    </div>
  );
}
