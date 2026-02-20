import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Substep } from "@/data/steps";

interface SubstepTabsProps {
  substep: Substep;
  value: string;
  onValueChange: (value: string) => void;
}

export default function SubstepTabs({
  substep,
  value,
  onValueChange,
}: SubstepTabsProps) {
  const tabs = [
    { id: "description", label: "Description" },
    ...substep.subtasks.map((subtask) => ({
      id: `subtask-${subtask.id}`,
      label: `${subtask.id.toUpperCase()}. ${subtask.title}`,
    })),
  ];

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className="w-full border-b border-gray-200 bg-white"
    >
      <TabsList className="h-12 bg-transparent border-0 px-4">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
