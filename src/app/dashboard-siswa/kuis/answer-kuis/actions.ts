"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const submitQuizSchema = z.object({
  quiz_id: z.string().uuid("ID kuis tidak valid."),
  started_at: z.string().datetime({ offset: true }).optional(),
  answers: z.record(z.string().uuid("ID pertanyaan tidak valid."), z.string().uuid("ID pilihan jawaban tidak valid.")),
});

export type SubmitQuizResult = { status: "success"; score: number; message: string } | { status: "error"; message: string };

export async function submitQuizAction(payload: { quiz_id: string; started_at?: string; answers: Record<string, string> }): Promise<SubmitQuizResult> {
  const supabase = await createClient();

  // 1. Verifikasi sesi pengguna
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      message: "Sesi login berakhir. Silakan login kembali.",
    };
  }

  // 2. Validasi struktur payload
  const parsed = submitQuizSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message || "Format jawaban kuis tidak valid.",
    };
  }

  const { quiz_id, answers, started_at } = parsed.data;

  // 3. Cek apakah siswa sudah menyelesaikan kuis ini sebelumnya (cegah submit ganda)
  const { data: existingAttempt, error: attemptCheckError } = await supabase.from("quiz_attempts").select("id, completed_at").eq("quiz_id", quiz_id).eq("student_id", user.id).not("completed_at", "is", null).maybeSingle();

  if (attemptCheckError) {
    return {
      status: "error",
      message: "Gagal memeriksa riwayat pengerjaan kuis.",
    };
  }

  if (existingAttempt) {
    return {
      status: "error",
      message: "Kuis ini sudah pernah Anda selesaikan dan tidak dapat dikerjakan ulang.",
    };
  }

  // 4. Ambil pertanyaan & kunci jawaban otoritatif dari database (server-side only)
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(
      `
        id,
        quiz_options (
          id,
          is_correct
        )
      `,
    )
    .eq("quiz_id", quiz_id);

  if (questionsError || !questions || questions.length === 0) {
    return {
      status: "error",
      message: "Soal kuis tidak ditemukan atau belum tersedia.",
    };
  }

  // 5. Validasi kelengkapan jawaban dan hitung skor di server
  let correctCount = 0;
  const answerRows: Array<{ question_id: string; option_id: string }> = [];

  for (const question of questions) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) {
      return {
        status: "error",
        message: "Harap jawab seluruh pertanyaan sebelum mengumpulkan kuis.",
      };
    }

    const matchedOption = (question.quiz_options ?? []).find((opt) => opt.id === selectedOptionId);

    if (!matchedOption) {
      return {
        status: "error",
        message: "Terdeteksi pilihan jawaban yang tidak sesuai dengan soal.",
      };
    }

    if (matchedOption.is_correct) {
      correctCount += 1;
    }

    answerRows.push({
      question_id: question.id,
      option_id: selectedOptionId,
    });
  }

  const finalScore = Math.round((correctCount / questions.length) * 100);
  const completedAt = new Date().toISOString();
  const validStartedAt = started_at && !Number.isNaN(Date.parse(started_at)) && Date.parse(started_at) <= Date.parse(completedAt) ? started_at : completedAt;

  // 6. Simpan header hasil percobaan ke public.quiz_attempts
  const { data: insertedAttempt, error: insertAttemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id,
      student_id: user.id,
      score: finalScore,
      started_at: validStartedAt,
      completed_at: completedAt,
    })
    .select("id")
    .single();

  if (insertAttemptError || !insertedAttempt) {
    return {
      status: "error",
      message: `Gagal menyimpan hasil kuis: ${insertAttemptError?.message ?? "Unknown error"}`,
    };
  }

  // 7. Simpan rincian jawaban siswa ke public.quiz_attempt_answers
  const attemptAnswersPayload = answerRows.map((row) => ({
    attempt_id: insertedAttempt.id,
    question_id: row.question_id,
    option_id: row.option_id,
  }));

  const { error: insertAnswersError } = await supabase.from("quiz_attempt_answers").insert(attemptAnswersPayload);

  if (insertAnswersError) {
    // Rollback attempt jika detail jawaban gagal disimpan
    await supabase.from("quiz_attempts").delete().eq("id", insertedAttempt.id);
    return {
      status: "error",
      message: `Gagal menyimpan rincian jawaban: ${insertAnswersError.message}`,
    };
  }

  revalidatePath("/dashboard-siswa/kuis");
  revalidatePath("/dashboard-siswa/kuis/answer-kuis");

  return {
    status: "success",
    score: finalScore,
    message: `Skor akhir kamu: ${finalScore}/100 (${correctCount} dari ${questions.length} soal benar).`,
  };
}
