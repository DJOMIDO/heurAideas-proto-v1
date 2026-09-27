// frontend/src/pages/Auth.tsx

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await handleAuth(email, password, undefined, "login");

    setIsLoading(false);

    if (result.success) {
      navigate("/menu", { replace: true });
    } else {
      alert(result.error || "Login failed");
    }
  };

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
    <main className="flex min-h-screen flex-col md:flex-row">
      <section className="earthy-page relative flex min-h-screen flex-1 flex-col overflow-hidden px-5 py-8 sm:px-8 md:p-12">
        <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-[#A3B18A]/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-[#588157]/20 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          <div className="mb-8">
            <div className="earthy-mark mb-5 flex size-11 items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm">
              H
            </div>
            <p className="earthy-accent mb-2 text-sm font-semibold uppercase tracking-[0.18em]">
              HeurAIDEAS
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-stone-600">
              {mode === "login"
                ? "Sign in to continue your work."
                : "Start shaping better ideas with your team."}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="earthy-tabs grid h-full w-full grid-cols-2 rounded-lg p-1">
              <TabsTrigger
                value="login"
                className="flex-1 rounded-md py-2 font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 rounded-md py-2 font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Sign Up
              </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "login" ? (
            <form
              onSubmit={handleLogin}
              className="mt-8 w-full space-y-6"
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
                  className="w-full sm:w-1/2"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-1/2"
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
              className="mt-8 w-full space-y-6"
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
                  className="w-full sm:w-1/2"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      </section>

      <section className="earthy-panel hidden min-h-[180px] flex-1 items-center justify-center px-5 py-10 sm:min-h-[220px] sm:px-8 md:flex md:min-h-screen md:p-12">
        <div className="max-w-[400px] text-center text-white">
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl">Welcome to HeurAIDEAS</h2>
        </div>
      </section>
    </main>
  );
}
