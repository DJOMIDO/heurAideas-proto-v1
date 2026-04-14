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
import { getUserId } from "@/utils/auth";
import { getProjectDetail } from "@/api/projects";
import {
  syncCommentsFromApi,
  syncUnsyncedCommentsToApi,
} from "@/utils/commentState";

import { useWebSocket, type WebSocketMessage } from "@/hooks/useWebSocket";

import { useTypingIndicator } from "@/hooks/useTypingIndicator";

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

  const [commentModeState, setCommentModeState] = useState<
    Record<string, boolean>
  >({});

  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  // 编辑用户状态：{ fieldName: { userId, username, timestamp } }
  const [editingUsers, setEditingUsers] = useState<
    Record<string, { userId: number; username: string; timestamp: string }>
  >({});

  // 冲突字段状态：{ fieldName: { username, timestamp } }
  const [conflictFields, setConflictFields] = useState<
    Record<string, { username: string; timestamp: string }>
  >({});

  // projectSubstepId 映射
  const [projectSubstepIdMap, setProjectSubstepIdMap] = useState<
    Record<string, number>
  >({});

  const formDataMapRef = useRef<Map<string, Record<string, any>>>(new Map());
  const currentSubstepIdRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  // 打破 WebSocket 同步与自动保存的循环
  const isSyncingFromWebSocketRef = useRef(false);

  const step = stepsData.find((s) => s.id === Number(stepId));
  const substep = step?.substeps.find((s) => s.id === substepId);

  const projectIdNum = projectId ? Number(projectId) : 0;
  const currentUserId = getUserId() ?? 0;

  // 初始化编辑状态跟踪
  const { sendTypingIndicator } = useTypingIndicator({
    projectId: projectIdNum,
    substepId: substepId!,
    currentUserId,
    onEditingUsersChange: setEditingUsers,
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getCommentModeKey = (substepId: string, tabId: string) =>
    `${substepId}-${tabId}`;

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

  const handleSave = useCallback(async () => {
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

    try {
      await saveSubstepStateWithApi(projectIdNum, substepId, stateToSave, true);

      const projectSubstepId = projectSubstepIdMap[substepId];

      if (projectSubstepId) {
        const count = await syncUnsyncedCommentsToApi(
          projectIdNum,
          substepId,
          projectSubstepId,
        );

        if (count > 0) {
          await syncCommentsFromApi(projectIdNum, substepId, projectSubstepId);
          setCommentRefreshKey((prev) => prev + 1);
        }
      } else {
        console.error("[Substep] projectSubstepId is undefined!");
      }

      setLastSaved(new Date().toISOString());
      setIsSaving(false);
      hasUnsavedChangesRef.current = false;
      saveLastEditedSubstep(projectIdNum, Number(stepId), substepId);
    } catch (error) {
      console.error("[Substep] Manual save failed:", error);
      setIsSaving(false);
    }
  }, [
    substepId,
    projectIdNum,
    substepTabState,
    viewMode,
    splitViewTabs,
    stepId,
    projectSubstepIdMap,
  ]);

  // 监听 substepTabState 变化，自动保存到 localStorage
  useEffect(() => {
    if (!substepId || !projectIdNum || isLoadingRef.current) return;

    const currentTab = substepTabState[substepId];
    if (!currentTab) return;

    const currentFormData = formDataMapRef.current.get(substepId) || {};
    const stateToSave: Partial<SubstepState> = {
      activeTab: currentTab,
      formData: currentFormData,
      viewMode,
      splitView:
        viewMode === "split"
          ? { leftTab: splitViewTabs.left, rightTab: splitViewTabs.right }
          : undefined,
    };

    const STORAGE_PREFIX = "substep-state-";
    const userId = getUserId();
    const key = userId
      ? `${STORAGE_PREFIX}${userId}-${projectIdNum}-${substepId}`
      : `${STORAGE_PREFIX}${projectIdNum}-${substepId}`;

    const existingData = localStorage.getItem(key);
    const existing = existingData
      ? JSON.parse(existingData)
      : {
          activeTab: "description",
          formData: {},
        };

    const merged = {
      ...existing,
      ...stateToSave,
      lastSaved: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(merged));
  }, [substepTabState, substepId, projectIdNum, viewMode, splitViewTabs]);

  // 自动保存（500ms debounce）
  useEffect(() => {
    const timer = setTimeout(() => {
      // 如果正在从 WebSocket 同步，跳过自动保存
      if (
        isLoadingRef.current ||
        !substepId ||
        !projectIdNum ||
        isSyncingFromWebSocketRef.current
      ) {
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

        saveSubstepStateWithApi(projectIdNum, substepId, stateToSave, true)
          .then(() => {
            setLastSaved(new Date().toISOString());
            hasUnsavedChangesRef.current = false;
          })
          .catch((error) => {
            console.error("[Substep] Auto-save failed:", error);
          });
      }
    }, 2000);

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

  // Substep 切换 + 加载
  useEffect(() => {
    if (!substepId || !projectIdNum) return;

    const prevSubstepId = currentSubstepIdRef.current;

    if (prevSubstepId && prevSubstepId !== substepId) {
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

    currentSubstepIdRef.current = substepId;
    isLoadingRef.current = true;

    loadSubstepStateWithApi(projectIdNum, substepId)
      .then((saved) => {
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

  // 获取项目结构，建立 substepId 映射
  useEffect(() => {
    if (!projectIdNum) return;

    getProjectDetail(projectIdNum)
      .then((detail) => {
        const map: Record<string, number> = {};
        detail.steps.forEach((step) => {
          step.substeps.forEach((substep) => {
            map[substep.code] = substep.id;
          });
        });
        setProjectSubstepIdMap(map);
      })
      .catch((error) => {
        console.error("[Substep] Failed to load project detail:", error);
      });
  }, [projectIdNum]);

  const handleFormDataChange = (field: string, value: any) => {
    sendTypingIndicator(field);

    setFormData((prev) => {
      let newFormData: Record<string, any>;

      if (value === "" || value === null || value === undefined) {
        const { [field]: _, ...rest } = prev;
        newFormData = rest;
      } else {
        newFormData = { ...prev, [field]: value };
      }

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

  // WebSocket 实时刷新内容 + 评论 + 编辑冲突检测
  useWebSocket({
    projectId: projectIdNum,
    enabled: !!substepId && !!projectIdNum,
    onMessage: (message: WebSocketMessage) => {
      // 1. 处理内容保存
      if (
        message.type === "content_saved" &&
        message.substep_id === substepId
      ) {
        if (!hasUnsavedChangesRef.current) {
          isSyncingFromWebSocketRef.current = true;
          isLoadingRef.current = true;

          loadSubstepStateWithApi(projectIdNum, substepId!, true)
            .then((saved) => {
              if (saved) {
                setFormData(saved.formData || {});
                formDataMapRef.current.set(substepId!, saved.formData || {});
              }
              isLoadingRef.current = false;
              isSyncingFromWebSocketRef.current = false;
            })
            .catch((error) => {
              console.error("[Substep] WebSocket reload failed:", error);
              isLoadingRef.current = false;
              isSyncingFromWebSocketRef.current = false;
            });
        }
      }

      // 2. 处理评论变更
      if (
        ["comment_added", "comment_updated", "comment_deleted"].includes(
          message.type,
        )
      ) {
        setCommentRefreshKey((prev) => prev + 1);
      }

      // 3. 处理编辑状态
      if (message.type === "user_typing" && message.substep_id === substepId) {
        const field = message.field;
        if (message.user_id !== currentUserId) {
          if (hasUnsavedChangesRef.current) {
            setConflictFields((prev) => ({
              ...prev,
              [field]: {
                username: message.username,
                timestamp: message.timestamp,
              },
            }));
          }

          setEditingUsers((prev) => {
            return {
              ...prev,
              [field]: {
                userId: message.user_id,
                username: message.username,
                timestamp: message.timestamp,
              },
            };
          });
        }
      }

      // 4. 处理编辑停止
      if (message.type === "stop_typing" && message.substep_id === substepId) {
        const field = message.field;
        setEditingUsers((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
        setConflictFields((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    },
  });

  useEffect(() => {
    return () => {
      isSyncingFromWebSocketRef.current = false;
      isLoadingRef.current = false;
    };
  }, []);

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

  const isCommentMode =
    substepId && substep
      ? commentModeState[getCommentModeKey(substep.id, currentTabValue)] ||
        false
      : false;

  const handleSetCommentMode = useCallback(
    (value: boolean) => {
      if (substepId && substep) {
        const currentTab = substepTabState[substepId] || "description";
        setCommentModeState((prev) => ({
          ...prev,
          [`${substep.id}-${currentTab}`]: value,
        }));
      }
    },
    [substepId, substep, substepTabState],
  );

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
            isCommentMode={isCommentMode}
            setIsCommentMode={handleSetCommentMode}
            projectSubstepId={projectSubstepIdMap[substep.id]}
            commentRefreshKey={commentRefreshKey}
            editingUsers={editingUsers}
            conflictFields={conflictFields}
            parentCurrentUserId={currentUserId}
            onConflictResolve={(field: string) => {
              // 用户选择"保留我的" → 强制保存
              handleSave();
              setConflictFields((prev) => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
              });
            }}
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
                isCommentMode={isCommentMode}
                setIsCommentMode={handleSetCommentMode}
                projectSubstepId={projectSubstepIdMap[substep.id]}
                commentRefreshKey={commentRefreshKey}
                editingUsers={editingUsers}
                conflictFields={conflictFields}
                parentCurrentUserId={currentUserId}
                onConflictResolve={(field: string) => {
                  // 用户选择"保留我的" → 强制保存
                  handleSave();
                  setConflictFields((prev) => {
                    const updated = { ...prev };
                    delete updated[field];
                    return updated;
                  });
                }}
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
                isCommentMode={isCommentMode}
                setIsCommentMode={handleSetCommentMode}
                projectSubstepId={projectSubstepIdMap[substep.id]}
                commentRefreshKey={commentRefreshKey}
                editingUsers={editingUsers}
                conflictFields={conflictFields}
                parentCurrentUserId={currentUserId}
                onConflictResolve={(field: string) => {
                  // 用户选择"保留我的" → 强制保存
                  handleSave();
                  setConflictFields((prev) => {
                    const updated = { ...prev };
                    delete updated[field];
                    return updated;
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
