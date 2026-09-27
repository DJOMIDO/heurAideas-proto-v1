// frontend/src/pages/Menu.tsx

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, FolderOpen, LogOut, Plus, Sparkles } from "lucide-react";
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
      return;
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
    <main className="earthy-page min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="earthy-mark flex size-10 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm">
            H
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              HeurAIDEAS
            </p>
            <p className="text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-background">
              <div className="earthy-avatar flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white">
                {avatarInitial}
              </div>
              Manage account
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email || "Preview mode"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                signOut();
                navigate("/auth");
              }}
            >
              <LogOut data-icon="inline-start" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mx-auto w-full max-w-6xl py-16 sm:py-20">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-800">
            <Sparkles data-icon="inline-start" />
            Start with a clear next step
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Create a new project or continue exploring one of your recent ideas.
          </p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="earthy-menu-card group flex flex-col">
          <CardHeader className="gap-3">
            <div className="earthy-icon flex size-11 items-center justify-center rounded-lg text-white">
              <Plus />
            </div>
            <CardTitle className="text-xl">Create a new project</CardTitle>
            <CardDescription>
              Start a fresh workspace for a team, research question, or idea.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-5">
            <Button
              className="earthy-button w-full justify-between"
              onClick={() => setShowCreateDialog(true)}
              disabled={isLoading}
            >
              Create project
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>

        <Card className="earthy-menu-card group flex flex-col">
          <CardHeader className="gap-3">
            <div className="earthy-icon flex size-11 items-center justify-center rounded-lg text-white">
              <FolderOpen />
            </div>
            <CardTitle className="text-xl">Open an existing project</CardTitle>
            <CardDescription>
              Pick up where you left off with one of your recent workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-5">
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Loading recent projects...
                </p>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <Button
                    key={project.id}
                    variant="outline"
                    className="justify-between bg-background text-left"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <span className="truncate">{project.name}</span>
                    <ArrowUpRight data-icon="inline-end" />
                  </Button>
                ))
              ) : (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  No recent projects yet.
                </p>
              )}
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
    </main>
  );
}
