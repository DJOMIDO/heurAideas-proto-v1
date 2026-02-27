// src/pages/overview/DetailPanel.tsx

import { ResizablePanel } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText } from "lucide-react";
import { type Substep } from "@/data/steps";

interface DetailPanelProps {
  substep: Substep | null;
}

export default function DetailPanel({ substep }: DetailPanelProps) {
  return (
    <ResizablePanel defaultSize="75" minSize="20" className="bg-gray-50">
      <div className="h-full overflow-y-auto p-6">
        {substep ? (
          <Card className="h-full border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                {substep.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                  Description
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {substep.description || "No description available."}
                </p>
              </div>

              <div className="pt-4">
                {substep.subtasks && substep.subtasks.length > 0 ? (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue={substep.subtasks[0]?.id}
                  >
                    {substep.subtasks.map((task) => (
                      <AccordionItem key={task.id} value={task.id}>
                        <AccordionTrigger className="hover:no-underline">
                          {task.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-gray-600 text-sm mb-2">
                            {task.description || "No description provided"}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-sm text-gray-500">No tasks available</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p>Select a substep to view details</p>
          </div>
        )}
      </div>
    </ResizablePanel>
  );
}
