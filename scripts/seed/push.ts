import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { FOUNDATION as foundationLessons } from "./foundation";
import { A1 as a1Lessons } from "./a1";
import { A2 as a2Lessons } from "./a2";
import type { LessonSeed } from "./types";

const url = process.env["SUPABASE_URL"]!;
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
const db = createClient(url, key, { auth: { persistSession: false } });

function uuidFor(seed: string) {
  const h = createHash("md5").update(`sprachfluss:${seed}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function exercises(id: string, l: LessonSeed, base: number) {
  let o = base;
  const rows: Record<string, unknown>[] = [];
  const add = (
    phase: string,
    dimension: string,
    skill: string,
    type: string,
    prompt: string,
    content: unknown,
    explanation: string,
  ) => {
    rows.push({ lesson_id: id, phase, dimension, skill, type, prompt, content, explanation, order_index: o++ });
  };

  add("input", "phonology", "listening", "audio_dialogue", `Listen to the dialogue: ${l.dlg.title}`, {
    title: l.dlg.title,
    lines: l.dlg.lines.map(([speaker, de, en]) => ({ speaker, de, en })),
    question: l.dlg.q,
    options: l.dlg.opts,
    answer: l.dlg.a,
  }, l.dlg.note);

  add("input", "semantics", "reading", "reading_passage", `Read the passage: ${l.read.title}`, {
    title: l.read.title,
    text_de: l.read.de,
    text_en: l.read.en,
    question: l.read.q,
    options: l.read.opts,
    answer: l.read.a,
  }, l.read.note);

  add("output", "phonology", "speaking", "pronounce", "Repeat the sentence after the example.", {
    target_de: l.pron.de,
    en: l.pron.en,
    stress: l.pron.stress,
    tip: l.pron.tip,
  }, `Stress pattern: ${l.pron.stress}`);

  add("output", "morphology", "writing", "fill_blank", "Choose the word that completes the sentence.", {
    sentence: l.blanks[0].s,
    en: l.blanks[0].en,
    options: l.blanks[0].opts,
    answer: l.blanks[0].a,
  }, l.blanks[0].note);

  add("output", "syntax", "writing", "word_order", "Build the German sentence in the right order.", {
    tokens: l.order.answer,
    answer: l.order.answer,
    en: l.order.en,
  }, l.order.note);

  add("output", "semantics", "reading", "vocab_match", "Match each German word with its English meaning.", {
    pairs: l.vocab.map(([de, en]) => ({ de, en })),
  }, "Vocabulary matching builds recognition in both directions.");

  add("output", "pragmatics", "writing", "writing_prompt", l.write.prompt, {
    prompt: l.write.prompt,
    hint: l.write.hint,
    sample: l.write.sample,
  }, "Use the hint and compare your answer with the model.");

  add("feedback", "morphology", "writing", "fill_blank", "Review: choose the word that completes the sentence.", {
    sentence: l.blanks[1].s,
    en: l.blanks[1].en,
    options: l.blanks[1].opts,
    answer: l.blanks[1].a,
  }, l.blanks[1].note);

  add("feedback", "pragmatics", "reading", "pragmatics_choice", "What is the most appropriate response in this situation?", {
    scenario: l.prag.scenario,
    question: l.prag.q,
    options: l.prag.opts,
    answer: l.prag.a,
  }, l.prag.note);

  return rows;
}

async function run() {
  const batches: [LessonSeed[], number][] = [
    [foundationLessons, 1],
    [a1Lessons, 7],
    [a2Lessons, 27],
  ];

  for (const [lessons, start] of batches) {
    let order = start;
    for (const lesson of lessons) {
      const id = uuidFor(lesson.slug);
      const { error: le } = await db.from("lessons").upsert(
        {
          id,
          slug: lesson.slug,
          level: lesson.level,
          title: lesson.title,
          title_de: lesson.de,
          theme: lesson.theme,
          summary: lesson.summary,
          order_index: order,
        },
        { onConflict: "slug" },
      );
      if (le) throw new Error(`${lesson.slug}: ${le.message}`);

      await db.from("exercises").delete().eq("lesson_id", id);
      const { error: ee } = await db.from("exercises").insert(exercises(id, lesson, order * 100));
      if (ee) throw new Error(`${lesson.slug} exercises: ${ee.message}`);
      order += 1;
    }
  }

  const { count: lc } = await db.from("lessons").select("*", { count: "exact", head: true });
  const { count: ec } = await db.from("exercises").select("*", { count: "exact", head: true });
  console.log(`lessons=${lc} exercises=${ec}`);
}

run();
