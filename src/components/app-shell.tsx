import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Home, LineChart, RotateCcw, Languages, User } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/lessons", label: "Lessons", icon: BookOpen },
  { to: "/vocabulary", label: "Words", icon: Languages },
  { to: "/quiz-results", label: "Quizzes", icon: GraduationCap },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/review", label: "Review", icon: RotateCcw },
  { to: "/profile", label: "Profile", icon: User },
];


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/dashboard" className="font-serif text-xl tracking-tight text-cream">
            Sprach<span className="text-primary">fluss</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-cream"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-28 pt-8 md:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={1.6} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
