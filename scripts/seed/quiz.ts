import type { LessonSeed } from "./types";

type Row = Record<string, unknown>;

const mk = (
  lessonId: string,
  order: number,
  dimension: string,
  skill: string,
  type: string,
  prompt: string,
  content: unknown,
  explanation: string,
): Row => ({
  lesson_id: lessonId,
  phase: "quiz",
  dimension,
  skill,
  type,
  prompt,
  content,
  explanation,
  order_index: order,
});

function tokens(sentence: string) {
  return sentence.trim().replace(/\s+/g, " ").split(" ");
}

/** Blank out the longest content word of the pronunciation sentence. */
function blankItem(lessonId: string, order: number, l: LessonSeed) {
  const words = tokens(l.pron.de);
  const target = [...words].sort((a, b) => b.replace(/[.,!?]/g, "").length - a.replace(/[.,!?]/g, "").length)[0]!;
  const clean = target.replace(/[.,!?]/g, "");
  const sentence = l.pron.de.replace(target, target.replace(clean, "___"));
  const distractors = l.vocab
    .map(([de]) => de.split(" ").slice(-1)[0]!)
    .filter((w) => w.toLowerCase() !== clean.toLowerCase())
    .slice(0, 2);
  const options = [clean, ...distractors];
  const ordered = [options[1] ?? clean, options[0]!, options[2] ?? clean].filter(Boolean) as string[];
  const answer = ordered.indexOf(clean);
  return mk(
    lessonId,
    order,
    "semantics",
    "writing",
    "fill_blank",
    "Quiz: complete the sentence from this lesson.",
    { sentence, en: l.pron.en, options: ordered, answer: answer < 0 ? 0 : answer },
    `The full sentence is: ${l.pron.de}`,
  );
}

/** Rebuild a line from the lesson dialogue. */
function orderItem(lessonId: string, order: number, l: LessonSeed) {
  const line =
    [...l.dlg.lines]
      .map(([, de]) => de)
      .filter((de) => tokens(de).length >= 3 && tokens(de).length <= 8)
      .sort((a, b) => tokens(a).length - tokens(b).length)[0] ?? l.pron.de;
  const en = l.dlg.lines.find(([, de]) => de === line)?.[2] ?? l.pron.en;
  return mk(
    lessonId,
    order,
    "syntax",
    "writing",
    "word_order",
    "Quiz: put the sentence from the dialogue back in order.",
    { tokens: tokens(line), answer: tokens(line), en },
    "German keeps the conjugated verb in second position in statements.",
  );
}

/** Reverse-order vocabulary check. */
function vocabItem(lessonId: string, order: number, l: LessonSeed) {
  const pairs = [...l.vocab].reverse().slice(0, 4).map(([de, en]) => ({ de, en }));
  return mk(
    lessonId,
    order,
    "semantics",
    "reading",
    "vocab_match",
    "Quiz: match the key words from this lesson.",
    { pairs },
    "Recalling words in both directions is what makes them stick.",
  );
}

/** Reading comprehension without the text in front of you. */
function readItem(lessonId: string, order: number, l: LessonSeed) {
  return mk(
    lessonId,
    order,
    "semantics",
    "reading",
    "pragmatics_choice",
    "Quiz: what do you remember from the reading?",
    { scenario: l.read.title, question: l.read.q, options: l.read.opts, answer: l.read.a },
    l.read.note,
  );
}

function pragItem(lessonId: string, order: number, l: LessonSeed) {
  return mk(
    lessonId,
    order,
    "pragmatics",
    "reading",
    "pragmatics_choice",
    "Quiz: choose the right thing to say.",
    { scenario: l.prag.scenario, question: l.prag.q, options: l.prag.opts, answer: l.prag.a },
    l.prag.note,
  );
}

/** Four quick questions closing out a single lesson. */
export function lessonQuiz(lessonId: string, l: LessonSeed, base: number): Row[] {
  return [
    vocabItem(lessonId, base, l),
    blankItem(lessonId, base + 1, l),
    orderItem(lessonId, base + 2, l),
    readItem(lessonId, base + 3, l),
  ];
}

/** A longer quiz drawing on every lesson of a level. */
export function levelQuiz(lessonId: string, lessons: LessonSeed[], base: number): Row[] {
  const builders = [vocabItem, blankItem, orderItem, readItem, pragItem];
  const step = Math.max(1, Math.floor(lessons.length / 12));
  const picked: LessonSeed[] = [];
  for (let i = 0; i < lessons.length && picked.length < 12; i += step) picked.push(lessons[i]!);
  return picked.map((l, i) => builders[i % builders.length]!(lessonId, base + i, l));
}

export function levelQuizLesson(level: "A0" | "A1" | "A2", order: number) {
  const meta = {
    A0: {
      title: "Foundation level quiz",
      de: "Test: Grundlagen",
      summary: "Twelve questions across the alphabet, sounds, numbers and the first grammar rules.",
    },
    A1: {
      title: "A1 level quiz",
      de: "Test: Niveau A1",
      summary: "Twelve questions covering everything from greetings and shopping to daily routines.",
    },
    A2: {
      title: "A2 level quiz",
      de: "Test: Niveau A2",
      summary: "Twelve questions on the past tenses, cases, subordinate clauses and opinions.",
    },
  }[level];
  return {
    slug: `quiz-${level.toLowerCase()}`,
    level,
    title: meta.title,
    title_de: meta.de,
    theme: "quiz",
    summary: meta.summary,
    order_index: order,
  };
}
