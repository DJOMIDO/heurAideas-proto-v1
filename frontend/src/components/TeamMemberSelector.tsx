// frontend/src/components/TeamMemberSelector.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getToken } from "@/utils/auth";

interface User {
  id: number;
  email: string;
  username: string;
}

interface TeamMemberSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (
    selectedMembers: { userId: number; role: string }[],
  ) => void;
  isCreating?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function TeamMemberSelector({
  open,
  onOpenChange,
  onCreateProject,
  isCreating = false,
}: TeamMemberSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<
    { userId: number; role: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      setSelectedMembers([]);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.userId === userId);
      if (exists) {
        return prev.filter((m) => m.userId !== userId);
      } else {
        return [...prev, { userId, role: "member" }];
      }
    });
  };

  const isMemberSelected = (userId: number) => {
    return selectedMembers.some((m) => m.userId === userId);
  };

  const handleCreate = () => {
    onCreateProject(selectedMembers);
  };

  const handleCancel = () => {
    setSelectedMembers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Select team members to collaborate on this project. You will be the
            project owner automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No users available. Please create users first.
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isMemberSelected(user.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isMemberSelected(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    {isMemberSelected(user.id) && (
                      <Badge variant="secondary">member</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {selectedMembers.length} member(s) selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
