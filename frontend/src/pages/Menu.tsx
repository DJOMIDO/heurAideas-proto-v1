// frontend/src/pages/Menu.tsx

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Folder, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserInfo, signOut, isAuthenticated, getUserId } from "@/utils/auth";
import { getProjects } from "@/api/projects";
import { getLastEditedSubstep } from "@/utils/substepState";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { WebSocketMessage } from "@/hooks/useWebSocket";
import CreateProjectDialog from "@/components/CreateProjectDialog";

interface Project {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

export default function Menu() {
  const navigate = useNavigate();
  const user = getUserInfo();
  const userId = getUserId();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProjects();
      setProjects(data.slice(0, 3));
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleWsMessage = useCallback(
    (msg: WebSocketMessage) => {
      if (msg.type === "project_added") {
        loadProjects();
        toast.success(`You've been added to "${msg.project_name}"`, {
          description: `Invited by ${msg.invited_by || "a team member"}`,
          duration: 10000,
          action: {
            label: "Open",
            onClick: () => {
              const storageKey = userId
                ? `currentProjectId-${userId}`
                : "currentProjectId";
              localStorage.setItem(storageKey, String(msg.project_id));
              navigate(`/overview`, { replace: true });
            },
          },
        });
      }
    },
    [loadProjects, userId, navigate],
  );

  useWebSocket({
    userId: userId || undefined,
    enabled: !!userId,
    onMessage: handleWsMessage,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/auth");
    }
    loadProjects();
  }, [navigate, loadProjects]);

  const handleOpenProject = (projectId: number) => {
    const storageKey = userId
      ? `currentProjectId-${userId}`
      : "currentProjectId";
    localStorage.setItem(storageKey, String(projectId));
    const lastEdited = getLastEditedSubstep(projectId);

    if (lastEdited) {
      navigate(
        `/substep/${projectId}/${lastEdited.stepId}/${lastEdited.substepId}`,
        { replace: true },
      );
    } else {
      navigate(`/overview`, { replace: true });
    }
  };

  const avatarInitial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2 bg-white text-gray-800 shadow-md hover:shadow-lg hover:text-white border-0">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {avatarInitial}
                </span>
              </div>
              Manage account
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white border border-gray-200"
          >
            <div className="px-3 py-2">
              <p className="font-medium text-sm text-gray-900">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-gray-500">{user?.email || ""}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer hover:bg-gray-50"
              onClick={() => {
                signOut();
                navigate("/auth");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-20">
          Welcome, {user?.name || "Guest"}!
        </h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <Card className="bg-green-50 p-8 flex flex-col shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle>Create new project</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] flex items-center justify-center">
              <button
                className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowCreateDialog(true)}
                disabled={isLoading}
              >
                <Plus className="w-34 h-34 text-green-500" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 p-8 flex flex-col shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle>Open existing project</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] flex items-center justify-center">
              <button className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
                <Folder className="w-30 h-30 text-purple-500" />
              </button>
            </div>

            <div className="text-left w-full mt-2 border-t border-gray-200 pt-2">
              <h3 className="font-medium text-sm mb-2">Recent projects:</h3>
              <ul className="space-y-1 text-sm">
                {isLoading ? (
                  <li className="text-gray-500">Loading...</li>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <li
                      key={project.id}
                      className="hover:bg-purple-100 p-1.5 rounded transition-colors cursor-pointer"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      {project.name}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No recent projects</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        currentUser={{
          id: Number(userId) || 0,
          username: user?.name || "Guest",
          email: user?.email || "",
        }}
      />
    </div>
  );
}
