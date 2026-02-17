import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  ArrowLeft,
  FileText,
  Settings,
  LogOut,
  User,
  Menu as MenuIcon,
} from "lucide-react";
import { stepsData, type Step, type Substep } from "@/data/steps";

export default function Overview() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeStepId, setActiveStepId] = useState(1);
  const [selectedSubstep, setSelectedSubstep] = useState<Substep | null>(null);

  const activeStep =
    stepsData.find((step) => step.id === activeStepId) || stepsData[0];

  // 选择子步骤
  const handleSubstepSelect = (substep: Substep) => {
    setSelectedSubstep((prev) => (prev?.id === substep.id ? null : substep));
  };

  // 切换侧边栏折叠状态
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen">
      {/* ======== 最左侧：可折叠导航栏 ======== */}
      <div
        className={`${
          isSidebarCollapsed ? "w-16" : "w-64"
        } bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* 顶部：Logo + 折叠按钮 */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-800 font-bold text-sm">H</span>
                </div>
                <span className="text-white font-semibold">HeurAIDEAS</span>
              </div>
            ) : (
              <div></div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
              onClick={toggleSidebar}
            >
              <MenuIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 中间：导航按钮 */}
        <div className="flex-1 py-4">
          <div className="flex flex-col gap-2">
            {/* Back to Menu 按钮 */}
            {isSidebarCollapsed ? (
              <Button
                variant="ghost"
                className="w-12 h-12 p-0 flex items-center justify-center text-white hover:bg-gray-700 transition-all duration-200"
                onClick={() => navigate("/menu")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="justify-start px-4 py-3 text-white hover:bg-gray-700 transition-all duration-200"
                onClick={() => navigate("/menu")}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="ml-3">Back to Menu</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 左侧：菜单 (独立于顶部状态栏) */}
      <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* 菜单内容（固定高度，无滚动） */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeStepId.toString()}
              onValueChange={(value) => setActiveStepId(Number(value))}
              className="w-full"
            >
              <TabsList
                className="flex flex-col gap-2 w-full mt-4 h-full"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {stepsData.map((step) => (
                  <TabsTrigger
                    key={step.id}
                    value={step.id.toString()}
                    className={`w-full justify-start p-3 rounded-lg text-left 
              hover:bg-gray-100
              transition-all duration-200
              focus:ring-0 focus:ring-offset-0 focus:outline-none
              focus-visible:outline-none`}
                  >
                    <span className="font-medium">Step {step.id}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 右侧：内容区域 (包含顶部状态栏) */}
      <div className="flex-1 flex flex-col">
        {/* 顶部状态栏 (修复布局) */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div>
            <h1 className="text-lg font-medium text-gray-600">Status here</h1>{" "}
            <h2 className="text-2xl font-bold mt-2">
              Step {activeStep.id} : {activeStep.title}
            </h2>
          </div>
        </div>

        {/* 内容区域 (中间和右侧) */}
        <div className="flex flex-1 overflow-hidden">
          {/* 中间：子步骤列表 (ScrollArea) */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {activeStep.substeps.map((substep) => (
                  <div
                    key={substep.id}
                    onClick={() => handleSubstepSelect(substep)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors
                ${
                  selectedSubstep?.id === substep.id
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"
                }`}
                  >
                    <span className="font-medium">{substep.title}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 右侧：子任务详情 (Accordion) */}
          <div className="flex-1 flex flex-col overflow-auto">
            {selectedSubstep ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Description
                  </CardTitle>
                </CardHeader>
                <div className="px-6 pb-4 border-b border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedSubstep.description ||
                      "No description available for this substep."}
                  </p>
                </div>
                <CardContent className="flex-1 overflow-auto">
                  <div className="mb-4">
                    <Accordion type="single" collapsible className="w-full">
                      {selectedSubstep.subtasks.map((task) => (
                        <AccordionItem key={task.id} value={task.id}>
                          <AccordionTrigger className="py-3 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {task.title}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-2">
                            <p className="text-gray-600 italic">
                              Description:{" "}
                              {task.description || "No description provided"}
                            </p>
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">
                                Implementation Details
                              </h4>
                              <p className="text-gray-600">
                                {task.description ||
                                  "This subtask requires detailed implementation planning. Consider the system context and value analysis before proceeding."}
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  Select a substep to view details
                </p>
                <p className="text-sm mt-2">
                  Click on any substep in the middle panel to view its tasks and
                  details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
