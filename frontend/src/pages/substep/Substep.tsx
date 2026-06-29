// frontend/src/pages/substep/Substep.tsx

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
import { getUserId, getUserInfo } from "@/utils/auth";
import { getProjectDetail, getProjectMembers } from "@/api/projects";
import {
  syncCommentsFromApi,
  syncUnsyncedCommentsToApi,
} from "@/utils/commentState";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import type { WebSocketMessage } from "@/hooks/useWebSocket";

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
  }>({
    left: "",
    right: "",
  });

  const [commentModeState, setCommentModeState] = useState<
    Record<string, boolean>
  >({});
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [taskSyncKey, setTaskSyncKey] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [teamMembers, setTeamMembers] = useState<
    Array<{
      id: number;
      username: string;
      email?: string;
    }>
  >([]);

  const [editingUsers, setEditingUsers] = useState<
    Record<string, { userId: number; username: string; timestamp: string }>
  >({});

  const [conflictFields, setConflictFields] = useState<
    Record<string, { username: string; timestamp: string }>
  >({});

  const [projectSubstepIdMap, setProjectSubstepIdMap] = useState<
    Record<string, number>
  >({});

  const formDataMapRef = useRef<Map<string, Record<string, any>>>(new Map());
  const currentSubstepIdRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const editingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const step = stepsData.find((s) => s.id === Number(stepId));
  const substep = step?.substeps.find((s) => s.id === substepId);

  const projectIdNum = projectId ? Number(projectId) : 0;
  const currentUserId = getUserId() ?? 0;
  const userInfo = getUserInfo();

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      if (!substepId) return;

      if (
        message.type === "content_saved" &&
        message.substep_id === substepId
      ) {
        if (message.user_id === currentUserId) return;

        if (substepId === "2.1") setTaskSyncKey((k) => k + 1);

        isLoadingRef.current = true;
        loadSubstepStateWithApi(projectIdNum, substepId!, true)
          .then((saved) => {
            if (saved) {
              const remoteFormData = saved.formData || {};
              const localFormData =
                formDataMapRef.current.get(substepId!) || {};

              const mergedFormData = hasUnsavedChangesRef.current
                ? { ...remoteFormData, ...localFormData }
                : remoteFormData;

              setFormData(mergedFormData);
              formDataMapRef.current.set(substepId!, mergedFormData);
            }
            isLoadingRef.current = false;
          })
          .catch((error) => {
            console.error("[Substep] WebSocket reload failed:", error);
            isLoadingRef.current = false;
          });
      }

      if (
        ["comment_added", "comment_updated", "comment_deleted"].includes(
          message.type,
        )
      ) {
        setCommentRefreshKey((prev) => prev + 1);
      }

      if (message.type === "user_typing" && message.substep_id === substepId) {
        const field = message.field;

        if (message.user_id !== currentUserId) {

          if (editingTimeoutsRef.current.has(field)) {
            clearTimeout(editingTimeoutsRef.current.get(field)!);
          }

          setEditingUsers((prev) => ({
            ...prev,
            [field]: {
              userId: message.user_id,
              username: message.username || "User",
              timestamp: message.timestamp || new Date().toISOString(),
            },
          }));

          const timeoutId = setTimeout(() => {
            setEditingUsers((prev) => {
              const updated = { ...prev };
              delete updated[field];
              return updated;
            });
            editingTimeoutsRef.current.delete(field);
          }, 3000);

          editingTimeoutsRef.current.set(field, timeoutId);

          if (hasUnsavedChangesRef.current) {
            setConflictFields((prev) => ({
              ...prev,
              [field]: {
                username: message.username || "User",
                timestamp: message.timestamp || new Date().toISOString(),
              },
            }));
          }
        }
      }

      if (message.type === "stop_typing" && message.substep_id === substepId) {
        const field = message.field;
        if (editingTimeoutsRef.current.has(field)) {
          clearTimeout(editingTimeoutsRef.current.get(field)!);
          editingTimeoutsRef.current.delete(field);
        }
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
    [substepId, projectIdNum, currentUserId],
  );

  const { send: sendMessage } = useWebSocket({
    projectId: projectIdNum,
    enabled: !!substepId && !!projectIdNum,
    onMessage: handleWebSocketMessage,
  });

  const { sendTypingIndicator } = useTypingIndicator({
    projectId: projectIdNum,
    substepId: substepId!,
    currentUserId,
    sendWsMessage: sendMessage,
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
          ? { leftTab: splitViewTabs.left, rightTab: splitViewTabs.right }
          : undefined,
    };

    try {
      await saveSubstepStateWithApi(projectIdNum, substepId, stateToSave, true);

      if (sendMessage) {
        sendMessage({
          type: "content_saved",
          project_id: projectIdNum,
          substep_id: substepId,
          user_id: currentUserId,
          username: userInfo?.name || "User",
          timestamp: new Date().toISOString(),
        });
      }

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

          if (sendMessage) {
            sendMessage({
              type: "comment_added",
              project_id: projectIdNum,
              substep_id: substepId,
            });
          }
        }
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
    sendMessage,
    userInfo,
    currentUserId,
  ]);

  const handleSyncAndSave = useCallback(
    async (key: string, value: any) => {
      if (!substepId || !projectIdNum) return;
      try {
        const localFormData = formDataMapRef.current.get(substepId) || {};
        const newFormData = { ...localFormData, [key]: value };

        await saveSubstepStateWithApi(
          projectIdNum,
          substepId,
          { formData: newFormData },
          true,
        );

        setFormData(newFormData);
        formDataMapRef.current.set(substepId, newFormData);

        hasUnsavedChangesRef.current = false;

        if (sendMessage) {
          sendMessage({
            type: "content_saved",
            project_id: projectIdNum,
            substep_id: substepId,
            user_id: currentUserId,
            username: userInfo?.name || "User",
            timestamp: new Date().toISOString(),
          });
        }
        setLastSaved(new Date().toISOString());
      } catch (error) {
        console.error("[Substep] Sync and save failed:", error);
      }
    },
    [substepId, projectIdNum, currentUserId, sendMessage, userInfo],
  );

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
      : { activeTab: "description", formData: {} };

    const merged = {
      ...existing,
      ...stateToSave,
      lastSaved: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(merged));
  }, [substepTabState, substepId, projectIdNum, viewMode, splitViewTabs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoadingRef.current || !substepId || !projectIdNum) return;

      const currentFormData = formDataMapRef.current.get(substepId) || {};
      if (Object.keys(currentFormData).length > 0) {
        const stateToSave: Partial<SubstepState> = {
          activeTab: substepTabState[substepId] || "description",
          formData: currentFormData,
          viewMode,
          splitView:
            viewMode === "split"
              ? { leftTab: splitViewTabs.left, rightTab: splitViewTabs.right }
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
  }, [
    substepId,
    projectIdNum,
    substepTabState,
    viewMode,
    splitViewTabs,
    formData,
  ]);

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
              ? { leftTab: splitViewTabs.left, rightTab: splitViewTabs.right }
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
              ? { leftTab: splitViewTabs.left, rightTab: splitViewTabs.right }
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
          setViewMode(saved.viewMode || "single");
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

  useEffect(() => {
    if (!projectIdNum) return;

    Promise.all([
      getProjectDetail(projectIdNum).catch(() => null),
      getProjectMembers(projectIdNum).catch(() => ({ total: 0, members: [] })),
    ])
      .then(([detail, membersRes]) => {
        if (detail?.steps) {
          const map: Record<string, number> = {};
          detail.steps.forEach((step) => {
            step.substeps.forEach((substep) => {
              map[substep.code] = substep.id;
            });
          });
          setProjectSubstepIdMap(map);
        }

        const members = membersRes?.members || [];
        const count = membersRes?.total ?? membersRes?.members?.length ?? 0;
        if (count > 0) {
          setTeamSize(count);
          setTeamMembers(members);
        }
      })
      .catch((error) => {
        console.error("[Substep] Failed to load project data:", error);
      });
  }, [projectIdNum]);

  const handleFormDataChange = (field: string, value: any) => {
    const isTableField =
      field.includes("-docs-") ||
      field.includes("-parts-") ||
      field.includes("-needs-") ||
      field.includes("-effects-") ||
      field.includes("-element-");

    if (!isTableField) {
      sendTypingIndicator(field);
    }

    setFormData((prev) => {
      let newFormData: Record<string, any>;
      if (value === "" || value === null || value === undefined) {
        const { [field]: _, ...rest } = prev;
        newFormData = rest;
      } else {
        newFormData = { ...prev, [field]: value };
      }
      newFormData = cleanupEmptyFormDataFields(newFormData);
      if (substepId) formDataMapRef.current.set(substepId, newFormData);
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

  useEffect(() => {
    return () => {
      editingTimeoutsRef.current.forEach((timeoutId) =>
        clearTimeout(timeoutId),
      );
      editingTimeoutsRef.current.clear();
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
            teamSize={teamSize}
            teamMembers={teamMembers}
            onConflictResolve={(field: string) => {
              handleSave();
              setConflictFields((prev) => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
              });
            }}
            sendMessage={sendMessage}
            userInfo={userInfo}
            syncKey={taskSyncKey}
            onSyncAndSave={handleSyncAndSave}
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
                teamSize={teamSize}
                teamMembers={teamMembers}
                onConflictResolve={(field: string) => {
                  handleSave();
                  setConflictFields((prev) => {
                    const updated = { ...prev };
                    delete updated[field];
                    return updated;
                  });
                }}
                sendMessage={sendMessage}
                userInfo={userInfo}
                syncKey={taskSyncKey}
                onSyncAndSave={handleSyncAndSave}
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
                teamSize={teamSize}
                teamMembers={teamMembers}
                onConflictResolve={(field: string) => {
                  handleSave();
                  setConflictFields((prev) => {
                    const updated = { ...prev };
                    delete updated[field];
                    return updated;
                  });
                }}
                sendMessage={sendMessage}
                userInfo={userInfo}
                syncKey={taskSyncKey}
                onSyncAndSave={handleSyncAndSave}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
