// frontend/src/pages/overview/AppSidebar.tsx

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  FileText,
  Menu as MenuIcon,
  Settings,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { getUserInfo, signOut } from "@/utils/auth";

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

export default function AppSidebar({
  isCollapsed,
  onToggle,
  onNavigate,
}: AppSidebarProps) {
  const user = getUserInfo();
  const avatarInitial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`earthy-sidebar ${
        isCollapsed ? "w-16" : "w-64"
      } border-r border-[#588157]/30 flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20`}
    >
      <div className="p-4 border-b border-[#588157]/30 h-16 flex items-center justify-between">
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start px-2 py-2 text-white hover:bg-[#3A5A40]"
              >
                <div className="earthy-avatar flex size-9 items-center justify-center rounded-full shrink-0 border-2 border-[#A3B18A]">
                  <span className="text-white font-semibold text-sm">
                    {avatarInitial}
                  </span>
                </div>

                <div className="flex-1 min-w-0 ml-3 text-left">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.name || "Loading..."}
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-[#DAD7CD] shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="right"
              sideOffset={8}
              className="w-56 earthy-sidebar border-[#588157]/40"
            >
              <div className="px-3 py-2 border-b border-[#588157]/30">
                <p className="text-white font-medium text-sm">{user?.name}</p>
                <p className="text-[#DAD7CD]/70 text-xs">{user?.email || "Preview mode"}</p>
              </div>

              <DropdownMenuItem className="text-[#DAD7CD] hover:bg-[#3A5A40] hover:text-white cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[#DAD7CD] hover:bg-[#3A5A40] hover:text-white cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#588157]/30" />

              <DropdownMenuItem
                className="text-[#DAD7CD] hover:bg-[#3A5A40] hover:text-white cursor-pointer"
                onClick={() => {
                  signOut();
                  onNavigate("/auth");
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex-1"></div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white hover:bg-[#3A5A40] shrink-0"
          onClick={onToggle}
        >
          <MenuIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-hidden">
        <div className="flex flex-col gap-2 px-2">
          {isCollapsed ? (
            <Button
              variant="ghost"
              className="w-12 h-12 p-0 justify-center text-white hover:bg-[#3A5A40] transition-all duration-200"
              title="Manage Project"
            >
              <Settings className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-white hover:bg-[#3A5A40] transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
              <span className="ml-3">Manage Project</span>
            </Button>
          )}

          {isCollapsed ? (
            <Button
              variant="ghost"
              className="w-12 h-12 p-0 justify-center text-white hover:bg-[#3A5A40] transition-all duration-200"
              title="Switch Project"
            >
              <FileText className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-white hover:bg-[#3A5A40] transition-all duration-200"
            >
              <FileText className="w-5 h-5" />
              <span className="ml-3">Switch Project</span>
            </Button>
          )}

          {isCollapsed ? (
            <Button
              variant="ghost"
              className="w-12 h-12 p-0 justify-center text-white hover:bg-[#3A5A40] transition-all duration-200"
              title="Review Project"
            >
              <User className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-white hover:bg-[#3A5A40] transition-all duration-200"
            >
              <User className="w-5 h-5" />
              <span className="ml-3">Review Project</span>
            </Button>
          )}

          {isCollapsed ? (
            <Button
              variant="ghost"
              className="w-12 h-12 p-0 justify-center text-white hover:bg-[#3A5A40] transition-all duration-200"
              title="Manage Documents"
              onClick={() => onNavigate("/documents")}
            >
              <FileText className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-white hover:bg-[#3A5A40] transition-all duration-200"
              onClick={() => onNavigate("/documents")}
            >
              <FileText className="w-5 h-5" />
              <span className="ml-3">Manage Documents</span>
            </Button>
          )}

          {isCollapsed ? (
            <Button
              variant="ghost"
              className="w-12 h-12 p-0 justify-center text-white hover:bg-[#3A5A40] transition-all duration-200"
              title="Evaluation"
              onClick={() => onNavigate("/evaluation")}
            >
              <FileText className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-white hover:bg-[#3A5A40] transition-all duration-200"
              onClick={() => onNavigate("/evaluation")}
            >
              <FileText className="w-5 h-5" />
              <span className="ml-3">Evaluation</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-2 border-t border-[#588157]/30">
        {isCollapsed ? (
          <Button
            variant="ghost"
            className="w-12 h-12 p-0 justify-center text-white hover:bg-[#3A5A40] transition-all duration-200"
            onClick={() => onNavigate("/menu")}
            title="Back to Menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3 text-white hover:bg-[#3A5A40] transition-all duration-200"
            onClick={() => onNavigate("/menu")}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="ml-3">Back to Menu</span>
          </Button>
        )}
      </div>
    </div>
  );
}
