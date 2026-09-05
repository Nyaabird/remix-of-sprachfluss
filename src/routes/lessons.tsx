import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Loading, RequireAuth } from "@/components/require-auth";
import { fetchAttempts, fetchExercises, fetchLessons } from "@/lib/data";
import { useAuth } from "@/lib/use-auth";
import type { Lesson } from "@/lib/learn";

export const Route = createFileRoute("/lessons")({
  head: () => ({
    meta: [
      { title: "German lessons: Foundation, A1 & A2 — Sprachfluss" },
      {
        name: "description",
        content:
          "Browse the Sprachfluss curriculum: start with the alphabet, sounds and numbers, then work through everyday A1 German and narrate the past at A2.",
      },
      { property: "og:title", content: "German lessons: Foundation, A1 & A2 — Sprachfluss" },
      {
        property: "og:description",
        content: "46 guided German lessons from the alphabet and numbers to the Perfekt, Präteritum and subordinate clauses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: () => (
    <RequireAuth>
      <Lessons />
    </RequireAuth>
  ),
});

function LessonCard({ lesson, own, done }: { lesson: Lesson; own: { id: string }[]; done: number }) {
  const percent = own.length ? Math.round((done / own.length) * 100) : 0;
  return (
    <Link
      to="/lesson/$slug"
      params={{ slug: lesson.slug }}
      className="surface group rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80">
            Lektion {lesson.order_index} · {lesson.level}
          </p>
          <h2 className="mt-2 font-serif text-xl text-cream">{lesson.title}</h2>
          <p className="font-serif text-sm text-secondary">{lesson.title_de}</p>
        </div>
        {percent === 100 && (
          <span className="rounded-full bg-secondary/20 p-2 text-secondary">
            <Check className="size-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lesson.summary}</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {done} of {own.length} exercises
      </p>
    </Link>
  );
}

function Lessons() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const lessons = useQuery({ queryKey: ["lessons"], queryFn: fetchLessons });
  const exercises = useQuery({ queryKey: ["exercises"], queryFn: () => fetchExercises() });
  const attempts = useQuery({ queryKey: ["attempts", userId], queryFn: () => fetchAttempts(userId), enabled: !!userId });

  if (!lessons.data || !exercises.data || !attempts.data) return <Loading label="Loading the curriculum" />;

  const byLevel = (level: string) => lessons.data.filter((l) => l.level === level).sort((a, b) => a.order_index - b.order_index);
  const a0 = byLevel("A0");
  const a1 = byLevel("A1");
  const a2 = byLevel("A2");

  const own = (lesson: Lesson) => exercises.data.filter((e) => e.lesson_id === lesson.id);
  const done = (lesson: Lesson) => own(lesson).filter((e) => attempts.data.some((a) => a.exercise_id === e.id)).length;

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Curriculum</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Lektionen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Work through them in order, or jump to whatever you need today.
        </p>
      </header>

      {a0.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.22em] text-secondary">Foundation — Alphabet, sounds & numbers</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {a0.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} own={own(lesson)} done={done(lesson)} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.22em] text-secondary">A1 — Everyday survival</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {a1.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} own={own(lesson)} done={done(lesson)} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.22em] text-secondary">A2 — Expanding your voice</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {a2.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} own={own(lesson)} done={done(lesson)} />
          ))}
        </div>
      </section>
    </div>
  );
}
