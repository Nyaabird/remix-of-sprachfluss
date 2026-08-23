import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your plan — Sprachfluss" },
      {
        name: "description",
        content: "Tell Sprachfluss your German level, goals and study time to personalise your first lessons.",
      },
      { property: "og:title", content: "Set up your German plan — Sprachfluss" },
      {
        property: "og:description",
        content: "Answer three short questions and get a personalised German A1 lesson plan.",
      },
    ],
  }),
  component: () => (
    <RequireAuth bare>
      <Onboarding />
    </RequireAuth>
  ),
});

const LEVELS = [
  { value: "beginner", label: "Complete beginner", hint: "Ich spreche kein Deutsch." },
  { value: "some", label: "Some German", hint: "A few phrases and greetings." },
  { value: "a1", label: "A1 completed", hint: "Ready to move towards A2." },
];

const GOALS = [
  { value: "travel", label: "Travel" },
  { value: "work", label: "Work" },
  { value: "family", label: "Family" },
  { value: "exam", label: "Exam prep" },
];

const TIMES = [5, 10, 20];

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("beginner");
  const [goals, setGoals] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(10);
  const [saving, setSaving] = useState(false);

  async function finish() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        self_level: level,
        goals,
        daily_minutes: minutes,
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("We could not save your plan. Please try again.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-14">
      <div className="mb-8 flex items-center gap-2">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <div key={step} className="animate-rise surface rounded-3xl p-7">
        {step === 0 && (
          <>
            <h1 className="font-serif text-3xl text-cream">Willkommen!</h1>
            <p className="mt-2 text-sm text-muted-foreground">How much German do you have already?</p>
            <div className="mt-6 space-y-3">
              {LEVELS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLevel(option.value)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition-all ${
                    level === option.value
                      ? "border-primary bg-primary/15"
                      : "border-border bg-background/30 hover:border-primary/60"
                  }`}
                >
                  <p className="font-serif text-lg text-cream">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.hint}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-serif text-3xl text-cream">Why German?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Pick everything that applies.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {GOALS.map((goal) => {
                const active = goals.includes(goal.value);
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() =>
                      setGoals((g) => (active ? g.filter((v) => v !== goal.value) : [...g, goal.value]))
                    }
                    className={`rounded-2xl border px-5 py-5 font-serif text-lg transition-all ${
                      active
                        ? "border-secondary bg-secondary/15 text-secondary"
                        : "border-border bg-background/30 text-cream/85 hover:border-primary/60"
                    }`}
                  >
                    {goal.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-serif text-3xl text-cream">Daily rhythm</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Short and steady beats long and rare. You can change this later.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setMinutes(time)}
                  className={`rounded-2xl border px-4 py-6 text-center transition-all ${
                    minutes === time
                      ? "border-primary bg-primary/15"
                      : "border-border bg-background/30 hover:border-primary/60"
                  }`}
                >
                  <p className="font-serif text-2xl text-cream">{time}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="rounded-xl text-muted-foreground hover:bg-muted"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button className="rounded-xl px-7" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button className="rounded-xl px-7" disabled={saving} onClick={finish}>
              {saving ? "Saving…" : "Start my first lesson"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
