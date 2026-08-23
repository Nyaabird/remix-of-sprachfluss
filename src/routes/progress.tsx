import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loading, RequireAuth } from "@/components/require-auth";
import { fetchAttempts, fetchMastery } from "@/lib/data";
import {
  DIMENSIONS,
  DIMENSION_BLURB,
  DIMENSION_LABEL,
  SKILLS,
  SKILL_LABEL,
  dimensionAverage,
  skillAverage,
} from "@/lib/learn";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your German progress — Sprachfluss" },
      {
        name: "description",
        content:
          "Track mastery of German phonology, morphology, syntax, lexicon and pragmatics across listening, speaking, reading and writing.",
      },
      { property: "og:title", content: "Your German progress — Sprachfluss" },
      {
        property: "og:description",
        content: "Mastery by dimension and skill, plus your accuracy trend over recent sessions.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Progress />
    </RequireAuth>
  ),
});

function Progress() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const mastery = useQuery({ queryKey: ["mastery", userId], queryFn: () => fetchMastery(userId), enabled: !!userId });
  const attempts = useQuery({ queryKey: ["attempts", userId], queryFn: () => fetchAttempts(userId), enabled: !!userId });

  if (!mastery.data || !attempts.data) return <Loading label="Crunching your numbers" />;

  const dimensionData = DIMENSIONS.map((d) => ({
    name: DIMENSION_LABEL[d],
    value: dimensionAverage(mastery.data, d),
    hint: DIMENSION_BLURB[d],
  }));
  const skillData = SKILLS.map((s) => ({ name: SKILL_LABEL[s], value: skillAverage(mastery.data, s) }));

  const byDay = new Map<string, { total: number; correct: number }>();
  for (const attempt of attempts.data) {
    const day = attempt.created_at.slice(0, 10);
    const entry = byDay.get(day) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (attempt.is_correct) entry.correct += 1;
    byDay.set(day, entry);
  }
  const trend = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([day, entry]) => ({
      day: day.slice(5),
      accuracy: Math.round((entry.correct / entry.total) * 100),
    }));

  const totalAttempts = attempts.data.length;
  const accuracy = totalAttempts
    ? Math.round((attempts.data.filter((a) => a.is_correct).length / totalAttempts) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Progress</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Dein Fortschritt</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {totalAttempts} exercises answered · {accuracy}% accurate overall.
        </p>
      </header>

      <section className="surface rounded-3xl p-7">
        <h2 className="font-serif text-2xl text-cream">By dimension</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dimensionData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="value" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {dimensionData.map((item) => (
            <p key={item.name} className="text-xs text-muted-foreground">
              <span className="font-serif text-sm text-cream">{item.name}</span> — {item.hint}
            </p>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {skillData.map((skill) => (
          <div key={skill.name} className="surface rounded-2xl p-5">
            <p className="font-serif text-xl text-cream">{skill.name}</p>
            <p className="mt-3 font-serif text-3xl text-primary">{skill.value}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-secondary" style={{ width: `${skill.value}%` }} />
            </div>
          </div>
        ))}
      </section>

      {trend.length > 1 && (
        <section className="surface rounded-3xl p-7">
          <h2 className="font-serif text-2xl text-cream">Accuracy trend</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-chart-2)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
