// frontend/src/pages/Evaluation.tsx

import CollapsibleCard from "@/components/CollapsibleCard";
import VideoPlayer from "@/components/VideoPlayer";

export default function Evaluation() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Evaluation Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <div className="flex flex-col gap-4">
          <CollapsibleCard title="Stream Information">
            <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
              [Placeholder: Form Inputs]
            </div>
          </CollapsibleCard>
        </div>

        <div className="flex flex-col gap-4">
          <CollapsibleCard title="Video Preview">
            <VideoPlayer />
          </CollapsibleCard>
        </div>

        <div className="flex flex-col gap-4">
          <CollapsibleCard title="Activity Feed">
            <div className="h-60 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
              [Placeholder: List of Activities]
            </div>
          </CollapsibleCard>
        </div>

        <div className="flex flex-col gap-4">
          <CollapsibleCard title="Raid and Host">
            <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
              [Placeholder: Search & Buttons]
            </div>
          </CollapsibleCard>
        </div>
      </div>
    </div>
  );
}
