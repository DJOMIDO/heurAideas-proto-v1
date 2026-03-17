// frontend/src/pages/overview/Overview.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { stepsData, type Substep } from "@/data/steps";
import { isAuthenticated, getUserId } from "@/utils/auth";

import AppSidebar from "./AppSidebar";
import StepMenu from "./StepMenu";
import StatusBar from "./StatusBar";
import SubstepList from "./SubstepList";
import DetailPanel from "./DetailPanel";

const getActiveStepStorageKey = (): string => {
  const userId = getUserId();
  return userId ? `overview-active-step-${userId}` : "overview-active-step";
};

const getSelectedSubstepStorageKey = (stepId: number): string => {
  const userId = getUserId();
  return userId
    ? `overview-selected-substep-${userId}-step-${stepId}`
    : `overview-selected-substep-step-${stepId}`;
};

export default function Overview() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/auth");
    }
  }, [navigate]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [activeStepId, setActiveStepId] = useState(() => {
    const stored = localStorage.getItem(getActiveStepStorageKey());
    return stored ? Number(stored) : 1;
  });

  const [selectedSubstep, setSelectedSubstep] = useState<Substep | null>(() => {
    const stored = localStorage.getItem(getSelectedSubstepStorageKey(1));
    if (stored) {
      const substepId = stored;
      const step1 = stepsData.find((s) => s.id === 1);
      return step1?.substeps.find((s) => s.id === substepId) || null;
    }
    return null;
  });

  const activeStep =
    stepsData.find((step) => step.id === activeStepId) || stepsData[0];

  const handleStepChange = (id: number) => {
    if (selectedSubstep) {
      localStorage.setItem(
        getSelectedSubstepStorageKey(activeStepId),
        selectedSubstep.id,
      );
    }

    setActiveStepId(id);
    localStorage.setItem(getActiveStepStorageKey(), String(id));

    const stored = localStorage.getItem(getSelectedSubstepStorageKey(id));
    if (stored) {
      const newStep = stepsData.find((s) => s.id === id);
      const substep = newStep?.substeps.find((s) => s.id === stored);
      if (substep) {
        setSelectedSubstep(substep);
      } else {
        setSelectedSubstep(null);
      }
    } else {
      setSelectedSubstep(null);
    }
  };

  const handleSubstepSelect = (substep: Substep) => {
    const newSelected = selectedSubstep?.id === substep.id ? null : substep;
    setSelectedSubstep(newSelected);

    if (newSelected) {
      localStorage.setItem(
        getSelectedSubstepStorageKey(activeStepId),
        newSelected.id,
      );
    } else {
      localStorage.removeItem(getSelectedSubstepStorageKey(activeStepId));
    }
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
            <StatusBar
              step={activeStep}
              substep={selectedSubstep || undefined}
            />

            <ResizablePanelGroup
              orientation="horizontal"
              className="flex-1 w-full"
            >
              <SubstepList
                substeps={activeStep.substeps}
                selectedId={selectedSubstep?.id ?? null}
                onSelect={handleSubstepSelect}
                stepId={activeStepId}
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
