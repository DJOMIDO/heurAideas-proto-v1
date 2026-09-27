// frontend/src/pages/Welcome.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/utils/auth";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="earthy-page relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:p-8">
      <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-[#A3B18A]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-[#588157]/20 blur-3xl" />
      <div className="relative w-full max-w-2xl text-center">
        <div className="earthy-mark mx-auto mb-6 flex size-12 items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm">
          H
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Welcome to HeurAIDEAS
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:mb-10 sm:text-lg">
          A collaborative space for exploring ideas and shaping better decisions.
        </p>

        <div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Button className="earthy-button w-full sm:w-auto" size="lg">
            See more information
          </Button>

          {isAuthenticated() ? (
            <Button
              variant="outline"
              className="earthy-button w-full sm:w-auto"
              size="lg"
              onClick={() => navigate("/menu", { replace: true })}
            >
              Enter App
            </Button>
          ) : (
            <Button
              className="earthy-button w-full sm:w-auto"
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Connect to HeurAIDEAS
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
