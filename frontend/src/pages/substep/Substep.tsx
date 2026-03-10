// src/pages/substep/Substep.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stepsData } from "@/data/steps";
import {
  loadSubstepStateWithApi,
  saveSubstepStateWithApi,
  saveLastEditedSubstep,
  type SubstepState,
} from "@/utils/substepState";
import { cleanupEmptyFormDataFields } from "@/utils/formDataUtils";

import AppSidebar from "../overview/AppSidebar";
import StatusBar from "../overview/StatusBar";
import SubstepMenu from "./SubstepMenu";
import SubstepTabs from "./SubstepTabs";
import SubstepContentCard from "./substep-content-card/SubstepContentCard";

export default function Substep() {
  const { projectId, stepId, substepId } = useParams<{
    projectId: string;
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

  const [viewMode, setViewMode] = useState<"single" | "split">("single");
  const [splitViewTabs, setSplitViewTabs] = useState<{
    left: string;
    right: string;
  }>({ left: "", right: "" });

  // 为每个 substep 独立存储 formData（不会被覆盖）
  const formDataMapRef = useRef<Map<string, Record<string, any>>>(new Map());
  // 跟踪当前 substepId
  const currentSubstepIdRef = useRef<string | undefined>(undefined);
  // 跟踪是否正在加载
  const isLoadingRef = useRef(false);
  // 跟踪是否有未保存的更改
  const hasUnsavedChangesRef = useRef(false);

  const step = stepsData.find((s) => s.id === Number(stepId));
  const substep = step?.substeps.find((s) => s.id === substepId);

  const projectIdNum = projectId ? Number(projectId) : 0;

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

  const handleSave = useCallback(() => {
    if (!substepId || !projectIdNum) return;

    setIsSaving(true);

    const currentFormData = formDataMapRef.current.get(substepId) || {};
    const stateToSave: Partial<SubstepState> = {
      activeTab: substepTabState[substepId] || "description",
      formData: currentFormData,
      viewMode,
      splitView:
        viewMode === "split"
          ? {
              leftTab: splitViewTabs.left,
              rightTab: splitViewTabs.right,
            }
          : undefined,
    };

    saveSubstepStateWithApi(projectIdNum, substepId, stateToSave, true)
      .then(() => {
        setLastSaved(new Date().toISOString());
        setIsSaving(false);
        hasUnsavedChangesRef.current = false;
        saveLastEditedSubstep(projectIdNum, Number(stepId), substepId);
      })
      .catch((error) => {
        console.error("[Substep] Manual save failed:", error);
        setIsSaving(false);
      });
  }, [
    substepId,
    projectIdNum,
    substepTabState,
    viewMode,
    splitViewTabs,
    stepId,
  ]);

  // 自动保存（500ms debounce）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoadingRef.current || !substepId || !projectIdNum) {
        return;
      }

      const currentFormData = formDataMapRef.current.get(substepId) || {};

      if (Object.keys(currentFormData).length > 0) {
        const stateToSave: Partial<SubstepState> = {
          activeTab: substepTabState[substepId] || "description",
          formData: currentFormData,
          viewMode,
          splitView:
            viewMode === "split"
              ? {
                  leftTab: splitViewTabs.left,
                  rightTab: splitViewTabs.right,
                }
              : undefined,
        };

        saveSubstepStateWithApi(projectIdNum, substepId, stateToSave, false)
          .then(() => {
            setLastSaved(new Date().toISOString());
            hasUnsavedChangesRef.current = false;
          })
          .catch((error) => {
            console.error("[Substep] Auto-save failed:", error);
          });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [substepId, projectIdNum, substepTabState, viewMode, splitViewTabs]);

  // 刷新/关闭页面前保存
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        hasUnsavedChangesRef.current &&
        substepId &&
        projectIdNum &&
        !isLoadingRef.current
      ) {
        const currentFormData = formDataMapRef.current.get(substepId) || {};
        const stateToSave: Partial<SubstepState> = {
          activeTab: substepTabState[substepId] || "description",
          formData: currentFormData,
          viewMode,
          splitView:
            viewMode === "split"
              ? {
                  leftTab: splitViewTabs.left,
                  rightTab: splitViewTabs.right,
                }
              : undefined,
        };

        const data = JSON.stringify(stateToSave);
        const blob = new Blob([data], { type: "application/json" });
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        navigator.sendBeacon(
          `${apiUrl}/projects/${projectIdNum}/substeps/${substepId}/state`,
          blob,
        );

        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [substepId, projectIdNum, substepTabState, viewMode, splitViewTabs]);

  // Substep 切换 + 加载（单个 useEffect，确保顺序）
  useEffect(() => {
    if (!substepId || !projectIdNum) return;

    const prevSubstepId = currentSubstepIdRef.current;

    // 步骤 1：检测切换，先保存旧 substep 的数据
    if (prevSubstepId && prevSubstepId !== substepId) {
      // 从 formDataMapRef 获取旧 substep 的数据（不会被覆盖）
      const prevFormData = formDataMapRef.current.get(prevSubstepId) || {};

      saveSubstepStateWithApi(
        projectIdNum,
        prevSubstepId,
        {
          activeTab: substepTabState[prevSubstepId] || "description",
          formData: prevFormData,
          viewMode,
          splitView:
            viewMode === "split"
              ? {
                  leftTab: splitViewTabs.left,
                  rightTab: splitViewTabs.right,
                }
              : undefined,
        },
        false,
      )
        .then(() => {
          hasUnsavedChangesRef.current = false;
        })
        .catch((error) => {
          console.error("[Substep] Immediate save failed:", error);
        });
    }

    // 步骤 2：更新 currentSubstepIdRef
    currentSubstepIdRef.current = substepId;

    // 步骤 3：加载新 substep 的数据
    isLoadingRef.current = true;

    loadSubstepStateWithApi(projectIdNum, substepId)
      .then((saved) => {
        console.log(
          "[Substep] Loaded saved state:",
          saved ? "found" : "not found",
        );
        if (saved) {
          setSubstepTabState((prev) => ({
            ...prev,
            [substepId]: saved.activeTab,
          }));
          setFormData(saved.formData || {});
          setLastSaved(saved.lastSaved || null);

          if (saved.viewMode) {
            setViewMode(saved.viewMode);
          } else {
            setViewMode("single");
          }

          if (saved.splitView) {
            setSplitViewTabs({
              left: saved.splitView.leftTab,
              right: saved.splitView.rightTab,
            });
          } else {
            setSplitViewTabs({ left: "", right: "" });
          }

          // 更新 formDataMapRef
          formDataMapRef.current.set(substepId, saved.formData || {});
        } else {
          setFormData({});
          setViewMode("single");
          setSplitViewTabs({ left: "", right: "" });
          formDataMapRef.current.set(substepId, {});
        }
        hasUnsavedChangesRef.current = false;
        isLoadingRef.current = false;
      })
      .catch((error) => {
        console.error("[Substep] Failed to load substep state:", error);
        setFormData({});
        setViewMode("single");
        setSplitViewTabs({ left: "", right: "" });
        formDataMapRef.current.set(substepId, {});
        hasUnsavedChangesRef.current = false;
        isLoadingRef.current = false;
      });
  }, [substepId, projectIdNum]);

  // handleFormDataChange 更新 formDataMapRef
  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev) => {
      let newFormData: Record<string, any>;

      // 值为空时删除该字段
      if (value === "" || value === null || value === undefined) {
        const { [field]: _, ...rest } = prev;
        newFormData = rest;
      } else {
        newFormData = { ...prev, [field]: value };
      }

      // 定期清理所有空字段（防止遗漏）
      newFormData = cleanupEmptyFormDataFields(newFormData);

      if (substepId) {
        formDataMapRef.current.set(substepId, newFormData);
      }
      hasUnsavedChangesRef.current = true;
      return newFormData;
    });
  };

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
            onClick={() => navigate("/menu")}
            className="text-blue-600 hover:underline"
          >
            Back to Menu
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
        projectId={projectIdNum}
        onSave={handleSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
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
            projectId={projectIdNum}
            stepId={Number(stepId)}
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
                projectId={projectIdNum}
                stepId={Number(stepId)}
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
                projectId={projectIdNum}
                stepId={Number(stepId)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
