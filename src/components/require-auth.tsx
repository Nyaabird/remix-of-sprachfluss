import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/use-auth";
import { AppShell } from "./app-shell";

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm">{label}…</span>
      </div>
    </div>
  );
}

export function RequireAuth({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return bare ? <Loading /> : <AppShell>{<Loading />}</AppShell>;
  }

  return bare ? <>{children}</> : <AppShell>{children}</AppShell>;
}
