import { createHash, existsSync } from "crypto";
import { existsSync as _exists } from "fs";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { LessonSeed } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "..");

const batches: { file: string; name: string; startOrder: number }[] = [
  { file: "./a1.ts", name: "expand_a1_curriculum", startOrder: 1 },
];

if (_exists(join(__dirname, "a2.ts"))) {
  batches.push({ file: "./a2.ts", name: "expand_a2_curriculum", startOrder: 21 });
}

function uuidFor(seed: string): string {
  const h = createHash("md5").update(`sprachfluss:${seed}`).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}

function escapeSql(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return "'" + text.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function exerciseRows(lessonId: string, lesson: LessonSeed, baseIndex: number): string[] {
  const rows: string[] = [];
  let order = baseIndex;

  const add = (
    phase: string,
    skill: string,
    type: string,
    dimension: string,
    prompt: string,
    content: Record<string, unknown>,
    explanation: string,
  ) => {
    rows.push(
      `INSERT INTO public.exercises (lesson_id, phase, dimension, skill, type, prompt, content, explanation, order_index) VALUES ` +
        `(${escapeSql(lessonId)}::uuid, ${escapeSql(phase)}, ${escapeSql(dimension)}, ${escapeSql(skill)}, ${escapeSql(type)}, ${escapeSql(prompt)}, ${escapeSql(JSON.stringify(content))}::jsonb, ${escapeSql(explanation)}, ${order}) ON CONFLICT (id) DO NOTHING;`,
    );
    order += 1;
  };

  // Input
  add(
    "input",
    "listening",
    "audio_dialogue",
    "phonology",
    `Listen to the dialogue: ${lesson.dlg.title}`,
    {
      title: lesson.dlg.title,
      lines: lesson.dlg.lines.map(([speaker, de, en]) => ({ speaker, de, en })),
      question: lesson.dlg.q,
      options: lesson.dlg.opts,
      answer: lesson.dlg.a,
    },
    lesson.dlg.note,
  );

  add(
    "input",
    "reading",
    "reading_passage",
    "semantics",
    `Read the passage: ${lesson.read.title}`,
    {
      title: lesson.read.title,
      text_de: lesson.read.de,
      text_en: lesson.read.en,
      question: lesson.read.q,
      options: lesson.read.opts,
      answer: lesson.read.a,
    },
    lesson.read.note,
  );

  // Output
  add(
    "output",
    "speaking",
    "pronounce",
    "phonology",
    "Repeat the sentence after the example.",
    {
      target_de: lesson.pron.de,
      en: lesson.pron.en,
      stress: lesson.pron.stress,
      tip: lesson.pron.tip,
    },
    `Stress pattern: ${lesson.pron.stress}`,
  );

  add(
    "output",
    "writing",
    "fill_blank",
    "morphology",
    "Choose the word that completes the sentence.",
    {
      sentence: lesson.blanks[0].s,
      en: lesson.blanks[0].en,
      options: lesson.blanks[0].opts,
      answer: lesson.blanks[0].a,
    },
    lesson.blanks[0].note,
  );

  add(
    "output",
    "writing",
    "word_order",
    "syntax",
    "Build the German sentence in the right order.",
    {
      tokens: lesson.order.answer,
      answer: lesson.order.answer,
      en: lesson.order.en,
    },
    lesson.order.note,
  );

  add(
    "output",
    "reading",
    "vocab_match",
    "semantics",
    "Match each German word with its English meaning.",
    {
      pairs: lesson.vocab.map(([de, en]) => ({ de, en })),
    },
    "Vocabulary matching builds recognition in both directions.",
  );

  // Feedback
  add(
    "feedback",
    "writing",
    "fill_blank",
    "morphology",
    "Review: choose the word that completes the sentence.",
    {
      sentence: lesson.blanks[1].s,
      en: lesson.blanks[1].en,
      options: lesson.blanks[1].opts,
      answer: lesson.blanks[1].a,
    },
    lesson.blanks[1].note,
  );

  add(
    "feedback",
    "reading",
    "pragmatics_choice",
    "pragmatics",
    "What is the most appropriate response in this situation?",
    {
      scenario: lesson.prag.scenario,
      question: lesson.prag.q,
      options: lesson.prag.opts,
      answer: lesson.prag.a,
    },
    lesson.prag.note,
  );

  // Output writing prompt
  add(
    "output",
    "writing",
    "writing_prompt",
    "pragmatics",
    lesson.write.prompt,
    {
      prompt: lesson.write.prompt,
      hint: lesson.write.hint,
      sample: lesson.write.sample,
    },
    "Use the hint and compare your answer with the model.",
  );

  return rows;
}

async function buildBatch(batch: { file: string; name: string; startOrder: number }) {
  const mod = (await import(batch.file)) as { [key: string]: LessonSeed[] };
  const key = Object.keys(mod).find((k) => Array.isArray(mod[k]));
  if (!key) throw new Error(`No array export found in ${batch.file}`);
  const lessons = mod[key];

  let sql = `-- Migration: ${batch.name}\n-- Generated from ${batch.file}; do not edit by hand.\n\n`;
  let orderIndex = batch.startOrder;

  for (const lesson of lessons) {
    const id = uuidFor(lesson.slug);
    sql += `INSERT INTO public.lessons (id, slug, level, title, title_de, theme, summary, order_index) VALUES `;
    sql += `(${escapeSql(id)}::uuid, ${escapeSql(lesson.slug)}, ${escapeSql(lesson.level)}, ${escapeSql(lesson.title)}, ${escapeSql(lesson.de)}, ${escapeSql(lesson.theme)}, ${escapeSql(lesson.summary)}, ${orderIndex}) ON CONFLICT (slug) DO UPDATE SET level = EXCLUDED.level, title = EXCLUDED.title, title_de = EXCLUDED.title_de, theme = EXCLUDED.theme, summary = EXCLUDED.summary, order_index = EXCLUDED.order_index;\n`;
    sql += exerciseRows(id, lesson, orderIndex * 100).join("\n");
    sql += "\n\n";
    orderIndex += 1;
  }

  const migrationsDir = join(ROOT, "supabase", "migrations");
  mkdirSync(migrationsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const path = join(migrationsDir, `${timestamp}_${batch.name}.sql`);
  writeFileSync(path, sql);
  console.log(`Wrote ${path} (${lessons.length} lessons, ${lessons.length * 9} exercises)`);
}

(async () => {
  for (const batch of batches) {
    await buildBatch(batch);
  }
})();
