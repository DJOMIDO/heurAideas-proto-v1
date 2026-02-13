import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Plus, Folder } from "lucide-react";

const mockUser = {
  name: "John Doe",
  recentProjects: [
    { id: 1, name: "Project 1" },
    { id: 2, name: "Project 2" },
    { id: 3, name: "Project 3" },
  ],
};

export default function Menu() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-10">
        <Button className="flex items-center gap-2 bg-white text-gray-800 shadow-md hover:shadow-lg hover:text-white border-0">
          <User className="w-4 h-4" />
          Manage account
        </Button>
      </div>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-20">
          Welcome, {mockUser.name}!
        </h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <Card className="bg-green-50 p-8 flex flex-col shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle>Create new project</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] flex items-center justify-center">
              <button className="bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity">
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
                {mockUser.recentProjects.map((project) => (
                  <li
                    key={project.id}
                    className="hover:bg-purple-100 p-1.5 rounded transition-colors cursor-pointer"
                  >
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
