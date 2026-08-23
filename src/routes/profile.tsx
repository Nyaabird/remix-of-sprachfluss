import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loading, RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "@/lib/data";
import { useGermanVoice } from "@/lib/speech";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Settings — Sprachfluss" },
      {
        name: "description",
        content: "Adjust your German study time, audio playback speed and translation help in Sprachfluss.",
      },
      { property: "og:title", content: "Settings — Sprachfluss" },
      {
        property: "og:description",
        content: "Study time, playback speed and translation preferences for your German lessons.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  ),
});

const SPEEDS = [0.7, 0.85, 1];

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const { speak } = useGermanVoice();
  const [saving, setSaving] = useState(false);

  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  if (!profile.data) return <Loading label="Loading your settings" />;
  const data = profile.data;

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save that change.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Settings</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Einstellungen</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
      </header>

      <section className="surface rounded-3xl p-7">
        <h2 className="font-serif text-2xl text-cream">Daily study time</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[5, 10, 20].map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={saving}
              onClick={() => save({ daily_minutes: minutes })}
              className={`rounded-2xl border px-4 py-5 transition-all ${
                data.daily_minutes === minutes
                  ? "border-primary bg-primary/15"
                  : "border-border bg-background/30 hover:border-primary/60"
              }`}
            >
              <p className="font-serif text-2xl text-cream">{minutes}</p>
              <p className="text-xs text-muted-foreground">minutes</p>
            </button>
          ))}
        </div>
      </section>

      <section className="surface rounded-3xl p-7">
        <h2 className="font-serif text-2xl text-cream">Audio speed</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Slow German first, native pace when you are ready.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              disabled={saving}
              onClick={() => {
                save({ playback_speed: speed });
                speak("Guten Morgen, wie geht es Ihnen?", { rate: speed });
              }}
              className={`rounded-2xl border px-4 py-5 transition-all ${
                Number(data.playback_speed) === speed
                  ? "border-secondary bg-secondary/15"
                  : "border-border bg-background/30 hover:border-secondary/60"
              }`}
            >
              <p className="font-serif text-2xl text-cream">{speed}×</p>
              <p className="text-xs text-muted-foreground">
                {speed === 1 ? "native" : speed === 0.85 ? "steady" : "slow"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="surface rounded-3xl p-7">
        <h2 className="font-serif text-2xl text-cream">Daily reminders</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A gentle nudge to keep your streak alive.
        </p>
        <div className="mt-4 flex gap-3">
          {[
            { value: true, label: "Remind me" },
            { value: false, label: "No reminders" },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              disabled={saving}
              onClick={() => save({ reminders_enabled: option.value })}
              className={`flex-1 rounded-2xl border px-4 py-5 font-serif text-lg transition-all ${
                data.reminders_enabled === option.value
                  ? "border-primary bg-primary/15 text-cream"
                  : "border-border bg-background/30 text-cream/80 hover:border-primary/60"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <Button
        variant="outline"
        className="rounded-xl border-border bg-transparent hover:bg-muted"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/" });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
