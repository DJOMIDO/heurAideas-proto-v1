// src/pages/substep/Substep.tsx

import { useState, useEffect, useCallback, useRef } from "react"; // 🔹 添加 useRef
import { useParams, useNavigate } from "react-router-dom";
import { stepsData } from "@/data/steps";
import {
  getSubstepState,
  saveSubstepState,
  type SubstepState,
} from "@/utils/substepState";

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

  // ─────────────────────────────────────────
  // 原有状态
  // ─────────────────────────────────────────
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [substepTabState, setSubstepTabState] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─────────────────────────────────────────
  // 🔹 分屏视图状态
  // ─────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"single" | "split">("single");
  const [splitViewTabs, setSplitViewTabs] = useState<{
    left: string;
    right: string;
  }>({ left: "", right: "" });

  // 🔹 新增：记录当前 substepId，用于检测切换
  const prevSubstepIdRef = useRef<string | undefined>(undefined);

  const step = stepsData.find((s) => s.id === Number(stepId));
  const substep = step?.substeps.find((s) => s.id === substepId);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleTabChange = (value: string) => {
    if (!substepId) return;

    if (viewMode === "split") {
      setSplitViewTabs((prev) => ({ ...prev, left: value }));
    } else {
      setSubstepTabState((prev) => ({
        ...prev,
        [substepId]: value,
      }));
    }
  };

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.setData("application/x-substep-tab", tabId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (position: "left" | "right", e: React.DragEvent) => {
    e.preventDefault();
    const tabId = e.dataTransfer.getData("application/x-substep-tab");
    if (tabId) {
      setSplitViewTabs((prev) => ({ ...prev, [position]: tabId }));
    }
  };

  const toggleSplitView = () => {
    setViewMode((prev) => {
      const newMode = prev === "single" ? "split" : "single";
      if (newMode === "split") {
        setSplitViewTabs({ left: "", right: "" });
      }
      return newMode;
    });
  };

  // ─────────────────────────────────────────
  // 🔹 保存函数（不变）
  // ─────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!substepId) return;

    setIsSaving(true);

    const stateToSave: Partial<SubstepState> = {
      activeTab: substepTabState[substepId] || "description",
      formData,
      viewMode,
      splitView:
        viewMode === "split"
          ? {
              leftTab: splitViewTabs.left,
              rightTab: splitViewTabs.right,
            }
          : undefined,
    };

    saveSubstepState(substepId, stateToSave);
    setLastSaved(new Date().toISOString());
    setIsSaving(false);
  }, [substepId, substepTabState, formData, viewMode, splitViewTabs]);

  // ─────────────────────────────────────────
  // 🔹 自动保存（防抖，不变）
  // ─────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (substepId && Object.keys(formData).length > 0) {
        handleSave();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [substepId, formData, handleSave]);

  // ─────────────────────────────────────────
  // 🔹 新增：切换 substep 时立即保存上一个 substep 的状态
  // ─────────────────────────────────────────
  useEffect(() => {
    // 检测 substepId 是否变化
    if (prevSubstepIdRef.current && prevSubstepIdRef.current !== substepId) {
      // 🔹 切换前立即保存上一个 substep 的状态
      saveSubstepState(prevSubstepIdRef.current, {
        activeTab: substepTabState[prevSubstepIdRef.current] || "description",
        formData,
        viewMode,
        splitView:
          viewMode === "split"
            ? {
                leftTab: splitViewTabs.left,
                rightTab: splitViewTabs.right,
              }
            : undefined,
      });
      console.log("💾 Auto-saved previous substep:", prevSubstepIdRef.current);
    }

    // 更新 ref
    prevSubstepIdRef.current = substepId;
  }, [substepId, substepTabState, formData, viewMode, splitViewTabs]);

  // ─────────────────────────────────────────
  // 🔹 加载已保存的状态（substepId 变化时）
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!substepId) return;

    const saved = getSubstepState(substepId);
    if (saved) {
      setSubstepTabState((prev) => ({
        ...prev,
        [substepId]: saved.activeTab,
      }));
      setFormData(saved.formData || {});
      setLastSaved(saved.lastSaved || null);

      // 🔹 恢复分屏状态
      if (saved.viewMode) {
        setViewMode(saved.viewMode);
        console.log("📖 Restored viewMode:", saved.viewMode);
      } else {
        setViewMode("single");
      }

      if (saved.splitView) {
        setSplitViewTabs({
          left: saved.splitView.leftTab,
          right: saved.splitView.rightTab,
        });
        console.log("📖 Restored splitView:", saved.splitView);
      } else {
        setSplitViewTabs({ left: "", right: "" });
      }
    } else {
      setViewMode("single");
      setSplitViewTabs({ left: "", right: "" });
    }
  }, [substepId]);

  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 小屏幕自动退出分屏
  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 1024 && viewMode === "split") {
        setViewMode("single");
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, [viewMode]);

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
          value={viewMode === "single" ? currentTabValue : splitViewTabs.left}
          onValueChange={handleTabChange}
          isSplitView={viewMode === "split"}
          onToggleSplitView={toggleSplitView}
          onTabDragStart={handleTabDragStart}
        />

        {viewMode === "single" ? (
          <SubstepContentCard
            substep={substep}
            activeTab={currentTabValue}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            lastSaved={lastSaved}
            isSaving={isSaving}
          />
        ) : (
          <div className="flex-1 flex flex-row overflow-hidden min-h-0">
            <div
              className="flex-1 flex flex-col min-w-0 border-r border-gray-200"
              onDrop={(e) => handleDrop("left", e)}
              onDragOver={(e) => e.preventDefault()}
            >
              <SubstepContentCard
                substep={substep}
                activeTab={splitViewTabs.left}
                formData={formData}
                onFormDataChange={handleFormDataChange}
                lastSaved={lastSaved}
                isSaving={isSaving}
                isDropTarget={true}
              />
            </div>

            <div
              className="flex-1 flex flex-col min-w-0"
              onDrop={(e) => handleDrop("right", e)}
              onDragOver={(e) => e.preventDefault()}
            >
              <SubstepContentCard
                substep={substep}
                activeTab={splitViewTabs.right}
                formData={formData}
                onFormDataChange={handleFormDataChange}
                lastSaved={lastSaved}
                isSaving={isSaving}
                isDropTarget={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
