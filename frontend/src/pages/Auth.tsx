import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// 新增：导入 auth 工具函数
import { handleAuth } from "@/utils/auth";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode =
    (searchParams.get("mode") as "login" | "register") || "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 新增：加载状态

  // 替换原有的 handleLogin
  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await handleAuth(email, password, undefined, "login");

    setIsLoading(false);

    if (result.success) {
      navigate("/menu");
    } else {
      alert(result.error || "Login failed");
    }
  };

  // 替换原有的 handleRegister
  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await handleAuth(email, password, username, "register");

    setIsLoading(false);

    if (result.success) {
      alert("Registration successful! Please login.");
      setMode("login");
    } else {
      alert(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 bg-white p-12 flex flex-col">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "login" | "register")}
          className="w-fit mx-auto"
        >
          <TabsList className="grid w-full h-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="login"
              className="flex-1 rounded-md py-2 font-semibold text-black data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="flex-1 rounded-md py-2 font-semibold text-black data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 flex items-center justify-center">
          {mode === "login" ? (
            <form
              onSubmit={handleLogin}
              className="w-full max-w-[400px] space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 bg-black text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-1/2 bg-gray-400 text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow"
                  onClick={() => navigate("/")}
                  disabled={isLoading}
                >
                  Back to Welcome
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleRegister}
              className="w-full max-w-[400px] space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col items-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 bg-black text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[linear-gradient(125deg,#6366f1_0%,#4f46e5_30%,#10b981_70%,#059669_100%)] flex items-center justify-center p-12">
        <div className="max-w-[400px] text-center text-white">
          <h2 className="text-5xl font-bold mb-6">Welcome to HeurAIDEAS</h2>
        </div>
      </div>
    </div>
  );
}
