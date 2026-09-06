import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loading, RequireAuth } from "@/components/require-auth";
import { fetchAttempts, fetchExercises, fetchLessons } from "@/lib/data";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/quiz-results")({
  head: () => ({
    meta: [
      { title: "Quiz results — Sprachfluss" },
      {
        name: "description",
        content:
          "See every Foundation, A1 and A2 German quiz score, and which lessons still need another round of review.",
      },
      { property: "og:title", content: "Quiz results — Sprachfluss" },
      {
        property: "og:description",
        content: "Your German quiz scores by level, plus the lessons worth revisiting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <QuizResults />
    </RequireAuth>
  ),
});

const LEVEL_LABEL: Record<string, string> = {
  A0: "Foundation",
  A1: "A1",
  "A1+": "A1+",
  A2: "A2",
  "A2+": "A2+",
};

function QuizResults() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const attempts = useQuery({
    queryKey: ["attempts", userId],
    queryFn: () => fetchAttempts(userId),
    enabled: !!userId,
  });
  const lessons = useQuery({ queryKey: ["lessons"], queryFn: fetchLessons });
  const exercises = useQuery({ queryKey: ["exercises"], queryFn: () => fetchExercises() });

  if (!attempts.data || !lessons.data || !exercises.data)
    return <Loading label="Adding up your quiz scores" />;

  const quizExercises = exercises.data.filter((e) => e.phase === "quiz");
  const best = new Map<string, number>();
  for (const a of attempts.data)
    best.set(a.exercise_id, Math.max(best.get(a.exercise_id) ?? 0, Number(a.score)));

  const rows = [...lessons.data]
    .sort((a, b) => a.order_index - b.order_index)
    .map((lesson) => {
      const own = quizExercises.filter((e) => e.lesson_id === lesson.id);
      const answered = own.filter((e) => best.has(e.id));
      const scores = answered.map((e) => best.get(e.id)!);
      const score = scores.length
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : null;
      return {
        lesson,
        total: own.length,
        answered: answered.length,
        score,
        isLevelQuiz: lesson.theme === "quiz",
      };
    })
    .filter((r) => r.total > 0);

  const levels = [...new Set(rows.map((r) => r.lesson.level))];
  const taken = rows.filter((r) => r.score !== null);
  const overall = taken.length
    ? Math.round(taken.reduce((s, r) => s + (r.score ?? 0), 0) / taken.length)
    : 0;
  const needsReview = rows.filter((r) => r.score !== null && r.score < 80);
  const notStarted = rows.filter((r) => r.score === null);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Quiz results</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Deine Testergebnisse</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {taken.length} of {rows.length} quizzes taken · {overall}% average score ·{" "}
          {needsReview.length} to review.
        </p>
      </header>

      {(needsReview.length > 0 || notStarted.length > 0) && (
        <section className="surface rounded-3xl p-7">
          <h2 className="font-serif text-2xl text-cream">Worth another look</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quizzes you scored under 80% on, plus the ones you have not tried yet.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[...needsReview, ...notStarted].slice(0, 12).map(({ lesson, score }) => (
              <Link
                key={lesson.id}
                to="/lesson/$slug"
                params={{ slug: lesson.slug }}
                className="rounded-full border border-border/60 px-4 py-2 text-sm text-cream transition-colors hover:bg-muted/60"
              >
                {lesson.title}
                <span className="ml-2 text-xs text-secondary">
                  {score === null ? "not taken" : `${score}%`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {levels.map((level) => {
        const levelRows = rows.filter((r) => r.lesson.level === level);
        const levelTaken = levelRows.filter((r) => r.score !== null);
        const levelAvg = levelTaken.length
          ? Math.round(levelTaken.reduce((s, r) => s + (r.score ?? 0), 0) / levelTaken.length)
          : 0;
        return (
          <section key={level} className="surface rounded-3xl p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl text-cream">
                {LEVEL_LABEL[level] ?? level} quizzes
              </h2>
              <p className="text-xs text-muted-foreground">
                {levelTaken.length}/{levelRows.length} taken · {levelAvg}% average
              </p>
            </div>
            <div className="mt-5 space-y-2">
              {levelRows.map(({ lesson, total, answered, score, isLevelQuiz }) => (
                <Link
                  key={lesson.id}
                  to="/lesson/$slug"
                  params={{ slug: lesson.slug }}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-base text-cream">
                      {lesson.title}
                      {isLevelQuiz && (
                        <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-primary">
                          Level test
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary transition-all"
                        style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-muted-foreground">
                    <span className="block">
                      {answered}/{total} questions
                    </span>
                    <span
                      className={`block font-serif text-base ${
                        score === null
                          ? "text-muted-foreground"
                          : score < 80
                            ? "text-destructive"
                            : "text-secondary"
                      }`}
                    >
                      {score === null ? "—" : `${score}%`}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
