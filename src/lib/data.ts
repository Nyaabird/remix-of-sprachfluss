import { supabase } from "@/integrations/supabase/client";
import {
  DIMENSIONS,
  SKILLS,
  boxInterval,
  nextScore,
  type Dimension,
  type Exercise,
  type Lesson,
  type MasteryRow,
  type Skill,
} from "./learn";

export type Profile = {
  id: string;
  display_name: string | null;
  self_level: string;
  goals: string[];
  daily_minutes: number;
  playback_speed: number;
  reminders_enabled: boolean;
  streak: number;
  last_study_date: string | null;
  onboarded: boolean;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as unknown as Profile;
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created as unknown as Profile;
}

export async function fetchLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Lesson[];
}

export async function fetchExercises(lessonId?: string): Promise<Exercise[]> {
  let query = supabase.from("exercises").select("*").order("order_index", { ascending: true });
  if (lessonId) query = query.eq("lesson_id", lessonId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Exercise[];
}

export async function fetchMastery(userId: string): Promise<MasteryRow[]> {
  const { data, error } = await supabase
    .from("mastery_scores")
    .select("dimension, skill, score, attempts")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as MasteryRow[];
  if (rows.length) return rows;
  return DIMENSIONS.flatMap((dimension) =>
    SKILLS.map((skill) => ({ dimension, skill, score: 20, attempts: 0 })),
  );
}

export async function fetchAttempts(userId: string) {
  const { data, error } = await supabase
    .from("exercise_attempts")
    .select("id, exercise_id, lesson_id, is_correct, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviewQueue(userId: string) {
  const { data, error } = await supabase
    .from("review_queue")
    .select("id, exercise_id, box, due_on, times_missed, resolved")
    .eq("user_id", userId)
    .eq("resolved", false)
    .order("due_on", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function recordAttempt(params: {
  userId: string;
  exercise: Exercise;
  isCorrect: boolean;
  response?: string;
}) {
  const { userId, exercise, isCorrect, response } = params;

  await supabase.from("exercise_attempts").insert({
    user_id: userId,
    exercise_id: exercise.id,
    lesson_id: exercise.lesson_id,
    is_correct: isCorrect,
    score: isCorrect ? 100 : 0,
    response: response ?? null,
  });

  await updateMastery(userId, exercise.dimension, exercise.skill, isCorrect);
  await updateReview(userId, exercise.id, isCorrect);
}

async function updateMastery(
  userId: string,
  dimension: Dimension,
  skill: Skill,
  isCorrect: boolean,
) {
  const { data } = await supabase
    .from("mastery_scores")
    .select("id, score, attempts")
    .eq("user_id", userId)
    .eq("dimension", dimension)
    .eq("skill", skill)
    .maybeSingle();

  const current = data ? Number(data.score) : 20;
  const score = nextScore(current, isCorrect);

  if (data) {
    await supabase
      .from("mastery_scores")
      .update({ score, attempts: data.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", data.id);
  } else {
    await supabase
      .from("mastery_scores")
      .insert({ user_id: userId, dimension, skill, score, attempts: 1 });
  }
}

async function updateReview(userId: string, exerciseId: string, isCorrect: boolean) {
  const { data } = await supabase
    .from("review_queue")
    .select("id, box, times_missed")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (!isCorrect) {
    const box = 1;
    const due = new Date();
    due.setDate(due.getDate() + boxInterval(box));
    if (data) {
      await supabase
        .from("review_queue")
        .update({
          box,
          due_on: due.toISOString().slice(0, 10),
          times_missed: data.times_missed + 1,
          resolved: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    } else {
      await supabase.from("review_queue").insert({
        user_id: userId,
        exercise_id: exerciseId,
        box,
        due_on: due.toISOString().slice(0, 10),
      });
    }
    return;
  }

  if (data) {
    const box = Math.min(data.box + 1, 5);
    const due = new Date();
    due.setDate(due.getDate() + boxInterval(box));
    await supabase
      .from("review_queue")
      .update({
        box,
        due_on: due.toISOString().slice(0, 10),
        resolved: box >= 4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  }
}

export async function touchStreak(profile: Profile) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  if (profile.last_study_date === todayKey) return profile.streak;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const continued = profile.last_study_date === yesterday.toISOString().slice(0, 10);
  const streak = continued ? profile.streak + 1 : 1;

  await supabase
    .from("profiles")
    .update({ streak, last_study_date: todayKey, updated_at: new Date().toISOString() })
    .eq("id", profile.id);

  return streak;
}
