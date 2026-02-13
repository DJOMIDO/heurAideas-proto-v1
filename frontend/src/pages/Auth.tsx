import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode =
    (searchParams.get("mode") as "login" | "register") || "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login:", { email, password });

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      console.log("Login successful:", data);

      // 保存 token
      localStorage.setItem("token", data.access_token);

      // 从 token 中解析用户名
      try {
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        localStorage.setItem("username", payload.sub);
      } catch (error) {
        console.error("Failed to parse token:", error);
      }

      // 跳转到菜单
      navigate("/menu");
    } catch (error) {
      console.error("Login error:", error);
      alert(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Register:", { email, username, password });

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      console.log("Registration successful:", data);
      alert("Registration successful! Please login.");
      setMode("login");
    } catch (error) {
      console.error("Registration error:", error);
      alert(error instanceof Error ? error.message : "Registration failed");
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
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button
                  type="submit"
                  className="w-1/2 bg-black text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Sign In
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-1/2 bg-gray-400 text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow"
                  onClick={() => navigate("/")}
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
                />
              </div>

              <div className="flex flex-col items-center">
                <Button
                  type="submit"
                  className="w-1/2 bg-black text-white hover:bg-gray-700 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Create Account
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
