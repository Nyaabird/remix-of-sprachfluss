import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { Loading, RequireAuth } from "@/components/require-auth";
import { ExerciseCard } from "@/components/exercise-card";
import { Button } from "@/components/ui/button";
import { fetchExercises, fetchLessons, fetchProfile, recordAttempt, touchStreak } from "@/lib/data";
import {
  DIMENSION_LABEL,
  PHASE_BLURB,
  PHASE_LABEL,
  SKILL_LABEL,
  type Exercise,
  type Phase,
} from "@/lib/learn";
import { useAuth } from "@/lib/use-auth";

const PHASES: Phase[] = ["input", "output", "feedback"];

export const Route = createFileRoute("/lesson/$slug")({
  head: () => ({
    meta: [
      { title: "German lesson — Sprachfluss" },
      {
        name: "description",
        content: "Move through input, output and feedback in a guided German lesson with audio and instant explanations.",
      },
      { property: "og:title", content: "German lesson — Sprachfluss" },
      {
        property: "og:description",
        content: "Listen, speak, write and review in one guided German lesson.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <LessonView />
    </RequireAuth>
  ),
});

function LessonView() {
  const { slug } = useParams({ from: "/lesson/$slug" });
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const lessons = useQuery({ queryKey: ["lessons"], queryFn: fetchLessons });
  const lesson = lessons.data?.find((l) => l.slug === slug);
  const exercises = useQuery({
    queryKey: ["exercises", lesson?.id],
    queryFn: () => fetchExercises(lesson?.id),
    enabled: !!lesson?.id,
  });
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });

  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const [log, setLog] = useState<{ exercise: Exercise; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  if (!lesson || !exercises.data || !profile.data) return <Loading label="Opening the lesson" />;

  const list = exercises.data;
  const current = list[index];
  const speed = Number(profile.data.playback_speed) || 1;

  async function handleSubmit(correct: boolean, response: string) {
    if (!current || !userId) return;
    setResult({ correct });
    setLog((l) => [...l, { exercise: current, correct }]);
    await recordAttempt({ userId, exercise: current, isCorrect: correct, response });
  }

  async function next() {
    setResult(null);
    if (index + 1 < list.length) {
      setIndex(index + 1);
      return;
    }
    if (profile.data) await touchStreak(profile.data);
    await queryClient.invalidateQueries();
    setFinished(true);
  }

  if (finished) {
    const missed = log.filter((entry) => !entry.correct);
    return (
      <div className="animate-rise space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Lesson complete</p>
          <h1 className="mt-3 font-serif text-4xl text-cream">{lesson.title_de}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {log.length - missed.length} of {log.length} correct. Everything you missed is queued for review.
          </p>
        </header>

        <div className="grid gap-3">
          {log.map((entry, i) => (
            <div
              key={`${entry.exercise.id}-${i}`}
              className={`surface flex items-start gap-3 rounded-2xl p-5 ${
                entry.correct ? "" : "border-primary/40"
              }`}
            >
              <span
                className={`mt-0.5 rounded-full p-1.5 ${
                  entry.correct ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
                }`}
              >
                {entry.correct ? <Check className="size-4" /> : <CircleAlert className="size-4" />}
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {DIMENSION_LABEL[entry.exercise.dimension]} · {SKILL_LABEL[entry.exercise.skill]}
                </p>
                <p className="mt-1 text-sm text-cream/90">{entry.exercise.prompt}</p>
                <p className="mt-2 text-sm text-secondary/90">{entry.exercise.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard">
            <Button className="rounded-xl px-7">Back to home</Button>
          </Link>
          {missed.length > 0 && (
            <Link to="/review">
              <Button variant="outline" className="rounded-xl border-border bg-transparent hover:bg-muted">
                Practise the {missed.length} missed item{missed.length === 1 ? "" : "s"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!current) return <Loading label="Opening the lesson" />;

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">
          Lektion {lesson.order_index} · {lesson.level}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-cream">{lesson.title_de}</h1>
        <p className="font-serif text-base text-secondary">{lesson.title}</p>
      </header>

      <div className="surface flex items-stretch gap-2 rounded-2xl p-2">
        {PHASES.map((phase) => {
          const active = current.phase === phase;
          const passed = PHASES.indexOf(phase) < PHASES.indexOf(current.phase);
          return (
            <div
              key={phase}
              className={`flex-1 rounded-xl px-4 py-3 text-center transition-colors ${
                active ? "bg-primary/20" : passed ? "bg-secondary/12" : ""
              }`}
            >
              <p
                className={`font-serif text-base ${
                  active ? "text-cream" : passed ? "text-secondary" : "text-muted-foreground"
                }`}
              >
                {PHASE_LABEL[phase]}
              </p>
              <p className="text-[11px] text-muted-foreground">{PHASE_BLURB[phase]}</p>
            </div>
          );
        })}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((index + (result ? 1 : 0)) / list.length) * 100}%` }}
        />
      </div>

      <section key={current.id} className="surface animate-rise rounded-3xl p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-primary/90">
            {DIMENSION_LABEL[current.dimension]}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-secondary/90">
            {SKILL_LABEL[current.skill]}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {index + 1} / {list.length}
          </span>
        </div>

        <p className="mb-6 text-sm text-cream/90">{current.prompt}</p>

        <ExerciseCard
          exercise={current}
          speed={speed}
          submitted={!!result}
          onSubmit={handleSubmit}
        />

        {result && (
          <div
            className={`mt-7 animate-pop rounded-2xl border p-5 ${
              result.correct ? "border-secondary/40 bg-secondary/10" : "border-primary/40 bg-primary/10"
            }`}
          >
            <p className={`font-serif text-lg ${result.correct ? "text-secondary" : "text-primary"}`}>
              {result.correct ? "Genau richtig!" : "Fast — schauen wir es uns an."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream/90">{current.explanation}</p>
            <Button className="mt-5 gap-2 rounded-xl" onClick={next}>
              {index + 1 < list.length ? "Continue" : "Finish lesson"}
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
