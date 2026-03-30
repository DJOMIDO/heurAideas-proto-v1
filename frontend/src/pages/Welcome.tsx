import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(125deg,#6366f1_0%,#4f46e5_30%,#10b981_70%,#059669_100%)] p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Welcome to HeurAIDEAS
        </h1>

        <p className="text-white text-lg mb-10 opacity-90">
          Short description of the project's aims
        </p>

        <div className="flex gap-4 justify-center">
          <Button className="bg-black text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow" size="lg">
            See more information
          </Button>

          <Button
            className="bg-black text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow" size="lg"
            onClick={() => navigate("/auth")}
          >
            Connect to HeurAIDEAS
          </Button>
        </div>
      </div>
    </div>
  );
}
