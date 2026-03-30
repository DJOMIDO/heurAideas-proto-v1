import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Step } from "@/data/steps";
import { useRef, useEffect, useState } from "react";

interface StepMenuProps {
  steps: Step[];
  activeStepId: number;
  onStepChange: (id: number) => void;
}

export default function StepMenu({
  steps,
  activeStepId,
  onStepChange,
}: StepMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTitle, setShowTitle] = useState(true);
  const WIDTH_THRESHOLD = 130; // 小于 130px 隐藏标题

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setShowTitle(width >= WIDTH_THRESHOLD);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 z-10 h-full"
    >
      <div className="flex-1 flex flex-col overflow-hidden py-2">
        <Tabs
          value={activeStepId.toString()}
          onValueChange={(value) => onStepChange(Number(value))}
          className="w-full"
        >
          <TabsList className="flex flex-col gap-1 w-full h-full bg-transparent p-2">
            {steps.map((step) => (
              <TabsTrigger
                key={step.id}
                value={step.id.toString()}
                className="w-full rounded-lg transition-all duration-200
                  bg-white border border-gray-200
                  hover:bg-gray-100 hover:border-gray-300
                  data-[state=active]:bg-blue-50 
                  data-[state=active]:border-blue-300 
                  data-[state=active]:text-blue-700
                  data-[state=active]:font-semibold
                  data-[state=active]:shadow-sm
                  p-3 justify-start"
              >
                <div className="flex items-center gap-1.5 w-full overflow-hidden">
                  <span className="font-semibold text-sm text-gray-900 shrink-0">
                    Step {step.id}
                  </span>

                  {showTitle && (
                    <span className="text-xs text-gray-500 truncate">
                      : {step.title}
                    </span>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
