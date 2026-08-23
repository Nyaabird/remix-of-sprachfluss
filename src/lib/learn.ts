export const DIMENSIONS = [
  "phonology",
  "morphology",
  "syntax",
  "semantics",
  "pragmatics",
] as const;
export const SKILLS = ["listening", "speaking", "reading", "writing"] as const;

export type Dimension = (typeof DIMENSIONS)[number];
export type Skill = (typeof SKILLS)[number];
export type Phase = "input" | "output" | "feedback";
export type ExerciseType =
  | "audio_dialogue"
  | "reading_passage"
  | "pronounce"
  | "fill_blank"
  | "word_order"
  | "vocab_match"
  | "pragmatics_choice"
  | "writing_prompt";

export const DIMENSION_LABEL: Record<Dimension, string> = {
  phonology: "Phonology",
  morphology: "Morphology",
  syntax: "Syntax",
  semantics: "Semantics",
  pragmatics: "Pragmatics",
};

export const DIMENSION_BLURB: Record<Dimension, string> = {
  phonology: "Sounds, stress and intonation",
  morphology: "Articles, genders and verb forms",
  syntax: "Word order and sentence building",
  semantics: "Vocabulary and meaning",
  pragmatics: "Register, politeness and context",
};

export const SKILL_LABEL: Record<Skill, string> = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
};

export const PHASE_LABEL: Record<Phase, string> = {
  input: "Input",
  output: "Output",
  feedback: "Feedback",
};

export const PHASE_BLURB: Record<Phase, string> = {
  input: "Listen and read",
  output: "Speak and write",
  feedback: "Review and fix",
};

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  title_de: string;
  theme: string;
  level: string;
  summary: string;
  order_index: number;
};

export type Exercise = {
  id: string;
  lesson_id: string;
  phase: Phase;
  dimension: Dimension;
  skill: Skill;
  type: ExerciseType;
  prompt: string;
  content: Record<string, unknown>;
  explanation: string;
  order_index: number;
};

export type MasteryRow = {
  dimension: Dimension;
  skill: Skill;
  score: number;
  attempts: number;
};

/** Weighted update: recent performance counts more than history. */
export function nextScore(current: number, correct: boolean): number {
  const target = correct ? 100 : 0;
  const value = current * 0.7 + target * 0.3;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function dimensionAverage(rows: MasteryRow[], dimension: Dimension): number {
  const list = rows.filter((r) => r.dimension === dimension);
  if (!list.length) return 0;
  return Math.round(list.reduce((sum, r) => sum + Number(r.score), 0) / list.length);
}

export function skillAverage(rows: MasteryRow[], skill: Skill): number {
  const list = rows.filter((r) => r.skill === skill);
  if (!list.length) return 0;
  return Math.round(list.reduce((sum, r) => sum + Number(r.score), 0) / list.length);
}

export function overallLevel(rows: MasteryRow[]): string {
  if (!rows.length) return "A1";
  const avg = rows.reduce((s, r) => s + Number(r.score), 0) / rows.length;
  if (avg >= 82) return "A2+";
  if (avg >= 62) return "A2";
  if (avg >= 40) return "A1+";
  return "A1";
}

export function weakestDimensions(rows: MasteryRow[]): Dimension[] {
  return [...DIMENSIONS]
    .map((d) => ({ d, v: dimensionAverage(rows, d) }))
    .sort((a, b) => a.v - b.v)
    .slice(0, 2)
    .map((x) => x.d);
}

/** Blend curriculum order with reinforcement of the weakest areas. */
export function recommendLesson(
  lessons: Lesson[],
  exercises: { lesson_id: string; dimension: Dimension }[],
  completedLessonIds: Set<string>,
  mastery: MasteryRow[],
): Lesson | undefined {
  const next = lessons.find((l) => !completedLessonIds.has(l.id));
  if (next) return next;
  const weak = weakestDimensions(mastery);
  const scored = lessons.map((l) => ({
    lesson: l,
    hits: exercises.filter((e) => e.lesson_id === l.id && weak.includes(e.dimension)).length,
  }));
  scored.sort((a, b) => b.hits - a.hits);
  return scored[0]?.lesson ?? lessons[0];
}

export function boxInterval(box: number): number {
  return [0, 1, 2, 4, 8, 16][Math.min(box, 5)] ?? 16;
}

export function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,!?;:()"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
