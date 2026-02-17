import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { stepsData, type Substep } from "@/data/steps";

import AppSidebar from "./AppSidebar";
import StepMenu from "./StepMenu";
import StatusBar from "./StatusBar";
import SubstepList from "./SubstepList";
import DetailPanel from "./DetailPanel";

export default function Overview() {
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeStepId, setActiveStepId] = useState(1);
  const [selectedSubstep, setSelectedSubstep] = useState<Substep | null>(null);

  const activeStep =
    stepsData.find((step) => step.id === activeStepId) || stepsData[0];

  const handleStepChange = (id: number) => {
    setActiveStepId(id);
    setSelectedSubstep(null);
  };

  const handleSubstepSelect = (substep: Substep) => {
    setSelectedSubstep((prev) => (prev?.id === substep.id ? null : substep));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        onNavigate={navigate}
      />

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-w-0">
        <ResizablePanel defaultSize="6" minSize="6" maxSize="25">
          <StepMenu
            steps={stepsData}
            activeStepId={activeStepId}
            onStepChange={handleStepChange}
          />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="w-2 bg-gray-200 hover:bg-gray-400 transition-colors z-10 cursor-col-resize"
        />

        <ResizablePanel defaultSize="85" minSize="50">
          <div className="flex flex-col h-full overflow-hidden">
            <StatusBar step={activeStep} />

            <ResizablePanelGroup
              orientation="horizontal"
              className="flex-1 w-full"
            >
              <SubstepList
                substeps={activeStep.substeps}
                selectedId={selectedSubstep?.id ?? null}
                onSelect={handleSubstepSelect}
              />

              <ResizableHandle
                withHandle
                className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors z-10 cursor-col-resize"
              />

              <DetailPanel substep={selectedSubstep} />
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
