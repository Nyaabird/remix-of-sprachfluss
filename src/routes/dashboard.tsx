import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Flame, Sparkles } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Loading, RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import {
  fetchAttempts,
  fetchExercises,
  fetchLessons,
  fetchMastery,
  fetchProfile,
  fetchReviewQueue,
} from "@/lib/data";
import {
  DIMENSIONS,
  DIMENSION_LABEL,
  dimensionAverage,
  overallLevel,
  recommendLesson,
  weakestDimensions,
} from "@/lib/learn";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your German plan — Sprachfluss" },
      {
        name: "description",
        content: "See your streak, skill mastery radar and today's recommended German lesson.",
      },
      { property: "og:title", content: "Your German plan — Sprachfluss" },
      {
        property: "og:description",
        content: "Streak, mastery radar and the next recommended German lesson, all in one place.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";

  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId), enabled: !!userId });
  const lessons = useQuery({ queryKey: ["lessons"], queryFn: fetchLessons });
  const exercises = useQuery({ queryKey: ["exercises"], queryFn: () => fetchExercises() });
  const mastery = useQuery({ queryKey: ["mastery", userId], queryFn: () => fetchMastery(userId), enabled: !!userId });
  const attempts = useQuery({ queryKey: ["attempts", userId], queryFn: () => fetchAttempts(userId), enabled: !!userId });
  const review = useQuery({ queryKey: ["review", userId], queryFn: () => fetchReviewQueue(userId), enabled: !!userId });

  useEffect(() => {
    if (profile.data && !profile.data.onboarded) navigate({ to: "/onboarding" });
  }, [profile.data, navigate]);

  if (!profile.data || !lessons.data || !exercises.data || !mastery.data || !attempts.data) {
    return <Loading label="Gathering your progress" />;
  }

  const completed = new Set<string>();
  for (const lesson of lessons.data) {
    const lessonExercises = exercises.data.filter((e) => e.lesson_id === lesson.id);
    const done = lessonExercises.every((e) => attempts.data.some((a) => a.exercise_id === e.id));
    if (lessonExercises.length && done) completed.add(lesson.id);
  }

  const recommended = recommendLesson(lessons.data, exercises.data, completed, mastery.data);
  const weak = weakestDimensions(mastery.data);
  const radarData = DIMENSIONS.map((d) => ({
    dimension: DIMENSION_LABEL[d],
    value: dimensionAverage(mastery.data, d),
  }));
  const dueCount = review.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <section className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">
          {greeting()} {profile.data.display_name ?? ""}
        </p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Bereit für heute?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your plan is tuned to {profile.data.daily_minutes} minutes a day.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface rounded-2xl p-5">
          <Flame className="size-5 text-primary" strokeWidth={1.5} />
          <p className="mt-3 font-serif text-3xl text-cream">{profile.data.streak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </div>
        <div className="surface rounded-2xl p-5">
          <Sparkles className="size-5 text-secondary" strokeWidth={1.5} />
          <p className="mt-3 font-serif text-3xl text-cream">{overallLevel(mastery.data)}</p>
          <p className="text-xs text-muted-foreground">estimated level</p>
        </div>
        <div className="surface rounded-2xl p-5">
          <p className="font-serif text-3xl text-cream">
            {completed.size}
            <span className="text-base text-muted-foreground">/{lessons.data.length}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">lessons completed</p>
        </div>
      </section>

      {recommended && (
        <section className="surface animate-rise rounded-3xl p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Today&rsquo;s lesson</p>
          <h2 className="mt-3 font-serif text-3xl text-cream">{recommended.title}</h2>
          <p className="font-serif text-lg text-secondary">{recommended.title_de}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{recommended.summary}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Chosen to strengthen {DIMENSION_LABEL[weak[0] ?? "morphology"].toLowerCase()} and{" "}
            {DIMENSION_LABEL[weak[1] ?? "syntax"].toLowerCase()}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/lesson/$slug" params={{ slug: recommended.slug }}>
              <Button className="rounded-xl px-7">Continue</Button>
            </Link>
            {dueCount > 0 && (
              <Link to="/review">
                <Button variant="outline" className="rounded-xl border-border bg-transparent hover:bg-muted">
                  {dueCount} item{dueCount === 1 ? "" : "s"} to review
                </Button>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="surface rounded-3xl p-7">
        <h2 className="font-serif text-2xl text-cream">Skill radar</h2>
        <p className="mt-1 text-xs text-muted-foreground">Mastery across the five dimensions of language.</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="var(--color-chart-1)"
                fill="var(--color-chart-1)"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen,";
  if (hour < 18) return "Guten Tag,";
  return "Guten Abend,";
}
