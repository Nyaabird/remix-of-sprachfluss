import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loading, RequireAuth } from "@/components/require-auth";
import { ExerciseCard } from "@/components/exercise-card";
import { fetchExercises, fetchProfile, fetchReviewQueue, recordAttempt } from "@/lib/data";
import { DIMENSION_LABEL, SKILL_LABEL, type Exercise } from "@/lib/learn";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review queue — Sprachfluss" },
      {
        name: "description",
        content: "Revisit the German items you missed, scheduled with spaced repetition so they stick.",
      },
      { property: "og:title", content: "Review queue — Sprachfluss" },
      {
        property: "og:description",
        content: "Spaced-repetition practice for the German items you got wrong.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Review />
    </RequireAuth>
  ),
});

function Review() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const queue = useQuery({ queryKey: ["review", userId], queryFn: () => fetchReviewQueue(userId), enabled: !!userId });
  const exercises = useQuery({ queryKey: ["exercises"], queryFn: () => fetchExercises() });
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  if (!queue.data || !exercises.data || !profile.data) return <Loading label="Loading your review queue" />;

  const items = queue.data
    .map((row) => exercises.data.find((e) => e.id === row.exercise_id))
    .filter((e): e is Exercise => !!e);

  if (!items.length) {
    return (
      <div className="animate-rise surface rounded-3xl p-10 text-center">
        <h1 className="font-serif text-3xl text-cream">Nichts zu wiederholen</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          Your review queue is empty. Anything you miss in a lesson lands here and comes back at just the
          right moment.
        </p>
        <Link to="/lessons" className="mt-6 inline-block">
          <Button className="rounded-xl px-7">Browse lessons</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(exercise: Exercise, correct: boolean, response: string) {
    if (!userId) return;
    setDone((d) => ({ ...d, [exercise.id]: correct }));
    await recordAttempt({ userId, exercise, isCorrect: correct, response });
    await queryClient.invalidateQueries();
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Spaced repetition</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Wiederholung</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} are due. Get one right and it moves further out.
        </p>
      </header>

      <div className="space-y-3">
        {items.map((exercise) => {
          const open = openId === exercise.id;
          const outcome = done[exercise.id];
          return (
            <div key={exercise.id} className="surface rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-primary/90">
                  {DIMENSION_LABEL[exercise.dimension]}
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-secondary/90">
                  {SKILL_LABEL[exercise.skill]}
                </span>
                {outcome !== undefined && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {outcome ? "Correct — scheduled further out" : "Still tricky — coming back soon"}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-cream/90">{exercise.prompt}</p>

              {open ? (
                <div className="mt-5">
                  <ExerciseCard
                    exercise={exercise}
                    speed={Number(profile.data?.playback_speed) || 1}
                    submitted={outcome !== undefined}
                    onSubmit={(correct, response) => handleSubmit(exercise, correct, response)}
                  />
                  {outcome !== undefined && (
                    <p className="mt-5 rounded-2xl border border-border bg-background/40 p-4 text-sm leading-relaxed text-cream/90">
                      {exercise.explanation}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl border-border bg-transparent hover:bg-muted"
                  onClick={() => setOpenId(exercise.id)}
                >
                  Practise again
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
