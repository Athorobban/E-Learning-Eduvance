"use server";

import { createClient } from "@/lib/supabase/server";
import { quizSchema } from "@/validations/quiz-validation";

type PrevState = {
  status?: string;
  errors?: Record<string, any>;
};

/* transform questions dari client:
   questions: [
     { question_text, options: string[4], correctIndex }
   ]
   -> db: quiz_questions + quiz_options (is_correct true where index === correctIndex)
*/

export async function createQuiz(prevState: PrevState, formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const rawQuestions = formData.get("questions");

  const validated = quizSchema.safeParse({ title, description });
  if (!validated.success) {
    return { status: "error", errors: { ...validated.error.flatten().fieldErrors, _form: [] } };
  }

  let questions = [];
  try {
    questions = JSON.parse(String(rawQuestions ?? "[]"));
  } catch (e) {
    return { status: "error", errors: { _form: ["Invalid questions payload"] } };
  }

  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  const created_by = user.data.user?.id ?? null;

  // insert quiz
  const { data: quizRow, error: quizErr } = await supabase
    .from("quizzes")
    .insert({ title: validated.data.title, description: validated.data.description ?? null, created_by })
    .select()
    .single();

  if (quizErr) return { status: "error", errors: { _form: [quizErr.message] } };

  const quizId = quizRow.id;

  // insert questions + options
  for (const q of questions) {
    const { data: qRow, error: qErr } = await supabase.from("quiz_questions").insert({ quiz_id: quizId, question_text: q.question_text }).select().single();

    if (qErr) return { status: "error", errors: { _form: [qErr.message] } };

    const questionId = qRow.id;
    const optsPayload = (q.options || []).map((optText: string, idx: number) => ({
      question_id: questionId,
      option_text: optText,
      is_correct: idx === Number(q.correctIndex),
    }));

    const { error: optErr } = await supabase.from("quiz_options").insert(optsPayload);
    if (optErr) return { status: "error", errors: { _form: [optErr.message] } };
  }

  return { status: "success" };
}

export async function updateQuiz(prevState: PrevState, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = formData.get("title");
  const description = formData.get("description");
  const rawQuestions = formData.get("questions");

  const validated = quizSchema.safeParse({ title, description });
  if (!validated.success) {
    return { status: "error", errors: { ...validated.error.flatten().fieldErrors, _form: [] } };
  }

  let questions = [];
  try {
    questions = JSON.parse(String(rawQuestions ?? "[]"));
  } catch (e) {
    return { status: "error", errors: { _form: ["Invalid questions payload"] } };
  }

  const supabase = await createClient();

  // update quiz row
  const { error: updateErr } = await supabase
    .from("quizzes")
    .update({ title: validated.data.title, description: validated.data.description ?? null })
    .eq("id", id);

  if (updateErr) return { status: "error", errors: { _form: [updateErr.message] } };

  // delete old questions & options
  const { data: oldQuestions } = await supabase.from("quiz_questions").select("id").eq("quiz_id", id);
  if (oldQuestions?.length) {
    const qIds = oldQuestions.map((q: any) => q.id);
    await supabase.from("quiz_options").delete().in("question_id", qIds);
    await supabase.from("quiz_questions").delete().eq("quiz_id", id);
  }

  // insert new questions + options
  for (const q of questions) {
    const { data: qRow, error: qErr } = await supabase.from("quiz_questions").insert({ quiz_id: id, question_text: q.question_text }).select().single();

    if (qErr) return { status: "error", errors: { _form: [qErr.message] } };

    const questionId = qRow.id;
    const optsPayload = (q.options || []).map((optText: string, idx: number) => ({
      question_id: questionId,
      option_text: optText,
      is_correct: idx === Number(q.correctIndex),
    }));

    const { error: optErr } = await supabase.from("quiz_options").insert(optsPayload);
    if (optErr) return { status: "error", errors: { _form: [optErr.message] } };
  }

  return { status: "success" };
}

export async function deleteQuiz(prevState: PrevState, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) return { status: "error", errors: { _form: [error.message] } };
  return { status: "success" };
}
