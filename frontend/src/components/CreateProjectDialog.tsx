// frontend/src/components/CreateProjectDialog.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, X, Mail, Loader2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToken, getUserId } from "@/utils/auth";
import { createProject } from "@/api/projects";

interface User {
  id: number;
  username: string;
  email: string;
}

interface MemberItem extends User {
  businessRole: string;
  isCreator?: boolean;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
}

const BUSINESS_ROLES = [
  "Project leader",
  "Project manager",
  "System designer",
  "HCI specialist",
];

const VISIBILITY_OPTIONS = [
  { value: "group", label: "Group", desc: "Members only" },
  { value: "private", label: "Private", desc: "Only you" },
  { value: "public", label: "Public", desc: "Visible to all" },
];

export default function CreateProjectDialog({
  open,
  onOpenChange,
  currentUser,
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [visibility, setVisibility] = useState("group");
  const [allMembers, setAllMembers] = useState<MemberItem[]>([
    {
      ...currentUser,
      username: `${currentUser.username} (You)`,
      businessRole: "Project leader",
      isCreator: true,
    },
  ]);

  const [selectedRole, setSelectedRole] = useState(BUSINESS_ROLES[1]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const token = getToken();
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await fetch(
          `${API_BASE_URL}/users/search?query=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(
            data.filter((u: User) => !allMembers.some((m) => m.id === u.id)),
          );
        } else {
          console.error("Failed to search users:", res.statusText);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Network error while searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allMembers]);

  const addMember = (user: User) => {
    if (allMembers.some((m) => m.id === user.id)) return;
    let newMembers = [...allMembers];

    if (selectedRole === "Project leader") {
      newMembers = newMembers.map((m) =>
        m.businessRole === "Project leader"
          ? { ...m, businessRole: "Project manager" }
          : m,
      );
    }

    newMembers.push({ ...user, businessRole: selectedRole, isCreator: false });
    setAllMembers(newMembers);
  };

  const removeMember = (userId: number) => {
    setAllMembers(allMembers.filter((m) => m.id !== userId));
  };

  const updateMemberRole = (userId: number, role: string) => {
    setAllMembers((prev) => {
      let newMembers = [...prev];
      if (role === "Project leader") {
        newMembers = newMembers.map((m) =>
          m.businessRole === "Project leader" && m.id !== userId
            ? { ...m, businessRole: "Project manager" }
            : m,
        );
      }
      return newMembers.map((m) =>
        m.id === userId ? { ...m, businessRole: role } : m,
      );
    });
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return;
    setIsCreating(true);
    try {
      const newProject = await createProject({
        name: projectName.trim(),
        description: "Created from enhanced Menu dialog",
        visibility: visibility,
      });

      const userId = getUserId();
      const storageKey = userId
        ? `currentProjectId-${userId}`
        : "currentProjectId";
      localStorage.setItem(storageKey, String(newProject.id));

      const invitedMembers = allMembers.filter((m) => !m.isCreator);
      if (invitedMembers.length > 0) {
        const token = getToken();
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:8000";

        for (const member of invitedMembers) {
          try {
            await fetch(`${API_BASE_URL}/projects/${newProject.id}/members`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                user_id: member.id,
                role: "member",
                business_role: member.businessRole,
              }),
            });
          } catch (error) {
            console.error(`Failed to add member ${member.id}:`, error);
          }
        }
      }

      setProjectName("");
      setVisibility("group");
      setAllMembers([
        {
          ...currentUser,
          username: `${currentUser.username} (You)`,
          businessRole: "Project leader",
          isCreator: true,
        },
      ]);
      setSelectedRole(BUSINESS_ROLES[1]);
      onOpenChange(false);

      navigate("/overview", { replace: true });
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const leaderCount = allMembers.filter(
    (m) => m.businessRole === "Project leader",
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up your project details and invite team members to collaborate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., HeurAIDEAS Redesign Evaluation"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="grid gap-3">
            <Label>Visibility</Label>
            <div className="grid grid-cols-3 gap-3">
              {VISIBILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex flex-col items-start gap-1 border rounded-lg p-3 cursor-pointer transition-all",
                    visibility === opt.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "hover:bg-muted/50 border-muted",
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="accent-primary h-4 w-4"
                    />
                    <span className="font-medium text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {opt.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <Label>Invite Members</Label>
            <div className="flex border rounded-lg overflow-hidden h-[320px] bg-background">
              <div className="w-48 border-r bg-muted/20 p-2 flex flex-col gap-1 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase">
                  Roles
                </p>
                {BUSINESS_ROLES.map((role) => {
                  const count = allMembers.filter(
                    (m) => m.businessRole === role,
                  ).length;

                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all text-left",
                        selectedRole === role
                          ? "bg-primary text-primary-foreground shadow-sm font-medium"
                          : "hover:bg-muted/80 text-foreground/80",
                      )}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {role === "Project leader" && (
                          <Crown className="h-3 w-3" />
                        )}
                        {role}
                      </span>
                      <span
                        className={cn(
                          "text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full",
                          selectedRole === role
                            ? "bg-background/20 text-primary-foreground"
                            : "bg-muted-foreground/20 text-foreground",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
                {leaderCount >= 1 && selectedRole === "Project leader" && (
                  <p className="text-[10px] text-muted-foreground px-2 mt-1 italic">
                    * Adding a new leader will replace the current one.
                  </p>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <Command className="border-none shadow-none h-full">
                  <div className="border-b p-2">
                    <CommandInput
                      placeholder={`Search users to add as "${selectedRole}"...`}
                      className="h-9"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                  </div>
                  <CommandList className="max-h-full py-2">
                    {isSearching && (
                      <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />{" "}
                        Searching...
                      </div>
                    )}
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.username}
                          onSelect={() => addMember(user)}
                          className="cursor-pointer px-4 py-2"
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {user.username}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                          <Check className="ml-2 h-4 w-4 text-primary opacity-0 group-data-[selected=true]:opacity-100" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {searchQuery.length < 2 && !isSearching && (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
                        Type at least 2 characters to search users...
                      </div>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>

            {allMembers.length > 0 && (
              <div className="mt-2 space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4 bg-muted/10">
                {BUSINESS_ROLES.map((role) => {
                  const membersInRole = allMembers.filter(
                    (m) => m.businessRole === role,
                  );
                  if (membersInRole.length === 0) return null;

                  return (
                    <div key={role}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                        {role === "Project leader" && (
                          <Crown className="h-3 w-3" />
                        )}
                        {role}
                        <span className="bg-muted px-1.5 py-0.5 rounded-full text-[10px]">
                          {membersInRole.length}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {membersInRole.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between bg-background border p-2 rounded shadow-sm"
                          >
                            <div className="flex-1 min-w-0 px-2">
                              <p className="text-sm font-medium truncate flex items-center gap-2">
                                {member.username}
                                {member.isCreator && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-normal">
                                    Creator
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>

                            <Select
                              value={member.businessRole}
                              onValueChange={(val) =>
                                updateMemberRole(member.id, val)
                              }
                            >
                              <SelectTrigger className="w-[150px] h-8 text-xs border-none shadow-none focus:ring-1 focus:ring-ring bg-muted/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUSINESS_ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {!member.isCreator && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeMember(member.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="outline"
              className="w-full gap-2 text-muted-foreground"
              disabled
            >
              <Mail className="h-4 w-4" />
              Send Email Invitations (Coming Soon)
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            className="min-w-[120px]"
            onClick={handleSubmit}
            disabled={!projectName.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
