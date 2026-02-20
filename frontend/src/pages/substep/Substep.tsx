// src/pages/substep/Substep.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stepsData } from "@/data/steps";
import { getSubstepState, saveSubstepState } from "@/utils/substepState";

import AppSidebar from "../overview/AppSidebar";
import StatusBar from "../overview/StatusBar";
import SubstepMenu from "./SubstepMenu";
import SubstepTabs from "./SubstepTabs";
import SubstepContentCard from "./substep-content-card/SubstepContentCard";

export default function Substep() {
  const { stepId, substepId } = useParams<{
    stepId: string;
    substepId: string;
  }>();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [substepTabState, setSubstepTabState] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = stepsData.find((s) => s.id === Number(stepId));
  const substep = step?.substeps.find((s) => s.id === substepId);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleTabChange = (value: string) => {
    if (substepId) {
      setSubstepTabState((prev) => ({
        ...prev,
        [substepId]: value,
      }));
    }
  };

  // 加载已保存的状态
  useEffect(() => {
    if (substepId) {
      const saved = getSubstepState(substepId);
      if (saved) {
        setSubstepTabState((prev) => ({
          ...prev,
          [substepId]: saved.activeTab,
        }));
        setFormData(saved.formData || {});
        setLastSaved(saved.lastSaved || null);
      }
    }
  }, [substepId]);

  // 保存函数
  const handleSave = useCallback(() => {
    if (!substepId) return;

    setIsSaving(true);
    saveSubstepState(substepId, {
      activeTab: substepTabState[substepId] || "description",
      formData,
    });
    setLastSaved(new Date().toISOString());
    setIsSaving(false);
  }, [substepId, substepTabState, formData]);

  // 自动保存（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (substepId && Object.keys(formData).length > 0) {
        handleSave();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [substepId, formData, handleSave]);

  // 表单更新回调
  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!step || !substep) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Substep not found
          </h1>
          <button
            onClick={() => navigate("/overview")}
            className="text-blue-600 hover:underline"
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  const currentTabValue = substepTabState[substep.id] || "description";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        onNavigate={navigate}
      />

      <SubstepMenu
        stepId={step.id}
        substeps={step.substeps}
        currentSubstepId={substep.id}
        onSave={handleSave}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <StatusBar step={step} substep={substep} />

        <SubstepTabs
          substep={substep}
          value={currentTabValue}
          onValueChange={handleTabChange}
        />

        <SubstepContentCard
          substep={substep}
          activeTab={currentTabValue}
          formData={formData}
          onFormDataChange={handleFormDataChange}
          lastSaved={lastSaved}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
