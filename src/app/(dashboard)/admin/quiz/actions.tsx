"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quizFormSchema } from "@/validations/quiz-validation";
import { QuizActionState } from "@/constants/quiz-constant";

async function authorizeQuizManager() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, userId: null, error: "Sesi login berakhir. Silakan login kembali." };
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();

  if (profileError || !profile) {
    return { supabase, userId: null, error: "Profil pengguna tidak ditemukan di database." };
  }

  if (!["Admin", "Guru"].includes(profile.role)) {
    return { supabase, userId: null, error: "Anda tidak memiliki izin mengelola kuis." };
  }

  return { supabase, userId: profile.id, error: null };
}

function parseQuizFormData(formData: FormData) {
  let parsedQuestions: unknown = [];
  try {
    parsedQuestions = JSON.parse(String(formData.get("questions") ?? "[]"));
  } catch {
    return {
      success: false as const,
      errorMessage: "Format data pertanyaan tidak valid.",
      fieldErrors: {},
    };
  }

  const validated = quizFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    questions: parsedQuestions,
  });

  if (!validated.success) {
    const flattened = validated.error.flatten();
    const firstIssue = validated.error.issues[0]?.message || "Periksa kembali isian form kuis.";
    return {
      success: false as const,
      errorMessage: firstIssue,
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  return {
    success: true as const,
    data: validated.data,
  };
}

export async function createQuiz(formData: FormData): Promise<QuizActionState> {
  const { supabase, userId, error: authError } = await authorizeQuizManager();
  if (authError || !userId) {
    return { status: "error", message: authError ?? "Akses ditolak." };
  }

  const parsed = parseQuizFormData(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.errorMessage,
      errors: parsed.fieldErrors,
    };
  }

  const { title, description, questions } = parsed.data;

  // 1. Insert ke tabel public.quizzes
  const { data: quizRow, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      title,
      description: description || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (quizErr || !quizRow) {
    return {
      status: "error",
      message: `Gagal menyimpan kuis: ${quizErr?.message ?? "Unknown error"}`,
    };
  }

  const quizId = quizRow.id;

  // 2. Insert pertanyaan & opsi dengan rollback jika terjadi kegagalan
  try {
    for (const q of questions) {
      const { data: qRow, error: qErr } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          question_text: q.question_text,
        })
        .select("id")
        .single();

      if (qErr || !qRow) {
        throw new Error(qErr?.message ?? "Gagal menyimpan pertanyaan.");
      }

      const optsPayload = q.options.map((optText, idx) => ({
        question_id: qRow.id,
        option_text: optText,
        is_correct: idx === q.correctIndex,
      }));

      const { error: optErr } = await supabase.from("quiz_options").insert(optsPayload);
      if (optErr) {
        throw new Error(optErr.message);
      }
    }
  } catch (err) {
    // Rollback kuis induk agar tidak meninggalkan data korup
    await supabase.from("quizzes").delete().eq("id", quizId);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Gagal menyimpan detail soal kuis.",
    };
  }

  revalidatePath("/admin/quiz");
  revalidatePath("/dashboard-siswa/quiz");

  return {
    status: "success",
    message: "Kuis dan seluruh pertanyaan berhasil dibuat.",
  };
}

export async function updateQuiz(formData: FormData): Promise<QuizActionState> {
  const { supabase, error: authError } = await authorizeQuizManager();
  if (authError) {
    return { status: "error", message: authError };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { status: "error", message: "ID kuis tidak valid." };
  }

  const parsed = parseQuizFormData(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.errorMessage,
      errors: parsed.fieldErrors,
    };
  }

  const { title, description, questions } = parsed.data;

  const { error: updateErr } = await supabase
    .from("quizzes")
    .update({
      title,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return { status: "error", message: `Gagal memperbarui kuis: ${updateErr.message}` };
  }

  // Hapus pertanyaan lama (quiz_options otomatis terhapus karena ON DELETE CASCADE)
  const { error: delQuestionsErr } = await supabase.from("quiz_questions").delete().eq("quiz_id", id);
  if (delQuestionsErr) {
    return { status: "error", message: `Gagal memperbarui soal lama: ${delQuestionsErr.message}` };
  }

  for (const q of questions) {
    const { data: qRow, error: qErr } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: id,
        question_text: q.question_text,
      })
      .select("id")
      .single();

    if (qErr || !qRow) {
      return { status: "error", message: qErr?.message ?? "Gagal menyimpan pertanyaan baru." };
    }

    const optsPayload = q.options.map((optText, idx) => ({
      question_id: qRow.id,
      option_text: optText,
      is_correct: idx === q.correctIndex,
    }));

    const { error: optErr } = await supabase.from("quiz_options").insert(optsPayload);
    if (optErr) {
      return { status: "error", message: optErr.message };
    }
  }

  revalidatePath("/admin/quiz");
  revalidatePath("/dashboard-siswa/quiz");

  return {
    status: "success",
    message: "Kuis berhasil diperbarui.",
  };
}

export async function deleteQuiz(formData: FormData): Promise<QuizActionState> {
  const { supabase, error: authError } = await authorizeQuizManager();
  if (authError) {
    return { status: "error", message: authError };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { status: "error", message: "ID kuis tidak valid." };
  }

  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) {
    return { status: "error", message: `Gagal menghapus kuis: ${error.message}` };
  }

  revalidatePath("/admin/quiz");
  revalidatePath("/dashboard-siswa/quiz");

  return {
    status: "success",
    message: "Kuis berhasil dihapus.",
  };
}
