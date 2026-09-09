import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Volume2 } from "lucide-react";
import { Loading, RequireAuth } from "@/components/require-auth";
import { fetchExercises, fetchLessons } from "@/lib/data";
import { useGermanVoice } from "@/lib/speech";
import type { Lesson } from "@/lib/learn";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "German vocabulary by lesson — Sprachfluss" },
      {
        name: "description",
        content:
          "Review every German word from the Sprachfluss course, grouped by lesson and level, with spoken pronunciation for each entry.",
      },
      { property: "og:title", content: "German vocabulary by lesson — Sprachfluss" },
      {
        property: "og:description",
        content: "Search the full Sprachfluss word list and hear each German word pronounced in context.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Vocabulary />
    </RequireAuth>
  ),
});

type Word = { de: string; en: string };
type Group = { lesson: Lesson; words: Word[] };

const LEVELS: { key: string; label: string }[] = [
  { key: "all", label: "All levels" },
  { key: "A0", label: "Foundation" },
  { key: "A1", label: "A1" },
  { key: "A2", label: "A2" },
];

function wordsFrom(content: Record<string, unknown>): Word[] {
  const pairs = content["pairs"];
  if (!Array.isArray(pairs)) return [];
  return pairs
    .map((pair) => pair as Record<string, unknown>)
    .filter((pair) => typeof pair?.["de"] === "string" && typeof pair?.["en"] === "string")
    .map((pair) => ({ de: String(pair["de"]), en: String(pair["en"]) }));
}

function Vocabulary() {
  const lessons = useQuery({ queryKey: ["lessons"], queryFn: fetchLessons });
  const exercises = useQuery({ queryKey: ["exercises"], queryFn: () => fetchExercises() });
  const { speak, supported } = useGermanVoice();
  const [level, setLevel] = useState("all");
  const [term, setTerm] = useState("");

  const groups = useMemo<Group[]>(() => {
    if (!lessons.data || !exercises.data) return [];
    const query = term.trim().toLowerCase();
    return lessons.data
      .filter((lesson) => level === "all" || lesson.level === level)
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => {
        const seen = new Set<string>();
        const words = exercises.data
          .filter((e) => e.lesson_id === lesson.id && e.type === "vocab_match")
          .flatMap((e) => wordsFrom(e.content))
          .filter((w) => {
            const key = w.de.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .filter((w) => !query || w.de.toLowerCase().includes(query) || w.en.toLowerCase().includes(query));
        return { lesson, words };
      })
      .filter((group) => group.words.length > 0);
  }, [lessons.data, exercises.data, level, term]);

  if (!lessons.data || !exercises.data) return <Loading label="Loading the word list" />;

  const total = groups.reduce((sum, g) => sum + g.words.length, 0);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Wortschatz</p>
        <h1 className="mt-3 font-serif text-4xl text-cream">Vocabulary</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {total} words from {groups.length} lessons. Tap a word to hear it spoken in German.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search German or English"
            aria-label="Search vocabulary"
            className="w-full rounded-full border border-border/60 bg-muted/40 py-2.5 pl-10 pr-4 text-sm text-cream outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLevel(item.key)}
              className={`rounded-full px-4 py-2 text-xs transition-colors ${
                level === item.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-cream"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="surface rounded-2xl p-6 text-sm text-muted-foreground">
          No words match that search yet. Try another spelling or clear the filters.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ lesson, words }) => (
            <section key={lesson.id} className="surface rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80">
                    {lesson.theme === "quiz" ? "Level quiz" : `Lektion ${lesson.order_index}`} · {lesson.level}
                  </p>
                  <h2 className="mt-1 font-serif text-xl text-cream">{lesson.title}</h2>
                </div>
                <Link
                  to="/lesson/$slug"
                  params={{ slug: lesson.slug }}
                  className="text-xs text-secondary underline-offset-4 hover:underline"
                >
                  Open lesson
                </Link>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {words.map((word) => (
                  <li
                    key={`${lesson.id}-${word.de}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3"
                  >
                    <div>
                      <p className="font-serif text-base text-cream">{word.de}</p>
                      <p className="text-xs text-muted-foreground">{word.en}</p>
                    </div>
                    {supported && (
                      <button
                        type="button"
                        onClick={() => speak(word.de)}
                        aria-label={`Hear ${word.de}`}
                        className="rounded-full bg-primary/15 p-2 text-primary transition-colors hover:bg-primary/25"
                      >
                        <Volume2 className="size-4" strokeWidth={1.8} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
