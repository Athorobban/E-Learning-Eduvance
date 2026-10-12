"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send, Award, FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AnswerQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  // State untuk menyimpan pilihan jawaban siswa: { question_id: option_id }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetching Data Kuis, Soal, Opsi, dan Attempt Siswa
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kuis-detail", id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User belum login");

      // Fetch kuis berserta soal dan opsi jawabannya
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          quiz_questions (
            id, question_text,
            quiz_options (id, option_text, is_correct)
          )
        `,
        )
        .eq("id", id)
        .single();

      if (quizError) throw quizError;

      // Fetch percobaan (attempt) kuis siswa ini
      const { data: attemptData } = await supabase.from("quiz_attempts").select("*, quiz_attempt_answers(question_id, option_id)").eq("quiz_id", id).eq("student_id", user.id).single();

      return { quiz: quizData, attempt: attemptData, user };
    },
  });

  // Jika siswa sudah pernah mengerjakan, isi state jawaban untuk ditampilkan (Read-Only)
  useEffect(() => {
    if (data?.attempt?.quiz_attempt_answers) {
      const pastAnswers: Record<string, string> = {};
      data.attempt.quiz_attempt_answers.forEach((ans: any) => {
        pastAnswers[ans.question_id] = ans.option_id;
      });
      setAnswers(pastAnswers);
    }
  }, [data]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    // Kunci opsi jika kuis sudah di-submit
    if (data?.attempt?.completed_at) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!data?.user || !data?.quiz) return;

    const totalQuestions = data.quiz.quiz_questions.length;

    // Validasi: Pastikan semua soal dijawab
    if (Object.keys(answers).length < totalQuestions) {
      toast.error("Gagal Mengumpulkan", { description: "Harap jawab seluruh pertanyaan sebelum mengumpulkan kuis." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Kalkulasi Skor
      let correctAnswers = 0;
      const attemptAnswersPayload: any[] = [];

      data.quiz.quiz_questions.forEach((q: any) => {
        const selectedOptionId = answers[q.id];
        const selectedOption = q.quiz_options.find((o: any) => o.id === selectedOptionId);

        if (selectedOption?.is_correct) correctAnswers++;

        attemptAnswersPayload.push({
          question_id: q.id,
          option_id: selectedOptionId,
        });
      });

      const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

      // 1. Simpan ke tabel quiz_attempts
      const { data: attemptResult, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: id,
          student_id: data.user.id,
          score: finalScore,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(), // Tandai selesai
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // 2. Simpan setiap jawaban ke tabel quiz_attempt_answers
      const answersToInsert = attemptAnswersPayload.map((ans) => ({
        ...ans,
        attempt_id: attemptResult.id,
      }));

      const { error: answersError } = await supabase.from("quiz_attempt_answers").insert(answersToInsert);

      if (answersError) throw answersError;

      toast.success("Kuis Berhasil Diselesaikan!", { description: `Skor Anda: ${finalScore}/100` });
      refetch(); // Segarkan data UI menjadi mode Read-Only
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-purple-500" />
        <p className="font-medium animate-pulse">Menyiapkan lembar soal...</p>
      </div>
    );
  }

  if (!data?.quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700">Kuis tidak ditemukan.</h2>
        <Link href="/dashboard-siswa/kuis" className="text-blue-600 hover:underline mt-2 inline-block">
          Kembali ke daftar kuis
        </Link>
      </div>
    );
  }

  const { quiz, attempt } = data;
  const isCompleted = !!attempt?.completed_at;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* KEMBALI */}
      <Link href="/dashboard-siswa/kuis" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors font-medium">
        <ArrowLeft className="size-4" /> Kembali ke Daftar Kuis
      </Link>

      {/* INFO KUIS & SKOR */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl inline-block mb-4">
              <FileQuestion className="size-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{quiz.title}</h1>
            <p className="mt-2 text-slate-600">{quiz.description}</p>
          </div>

          {/* Tampilkan Skor jika sudah selesai */}
          {isCompleted && (
            <div className="shrink-0 bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center min-w-[120px]">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Skor Akhir</p>
              <div className="text-4xl font-black text-purple-700 flex items-center justify-center gap-1">
                {attempt.score} <span className="text-lg text-purple-400">/100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DAFTAR SOAL */}
      <div className="space-y-6">
        {quiz.quiz_questions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500">Belum ada pertanyaan di dalam kuis ini.</div>
        ) : (
          quiz.quiz_questions.map((q: any, index: number) => (
            <div key={q.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex gap-4">
                <div className="shrink-0 size-8 bg-slate-100 text-slate-600 font-bold flex items-center justify-center rounded-full">{index + 1}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-800 leading-relaxed mb-4">{q.question_text}</h3>

                  <div className="space-y-3">
                    {q.quiz_options.map((opt: any) => {
                      const isSelected = answers[q.id] === opt.id;

                      // Logika pewarnaan jika kuis sudah selesai
                      let optionClasses = "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50";

                      if (isSelected) {
                        optionClasses = "border-purple-500 bg-purple-50 ring-1 ring-purple-500";
                      }

                      // Jika sudah selesai, tandai jawaban benar/salah secara visual
                      if (isCompleted) {
                        if (opt.is_correct) {
                          optionClasses = "border-emerald-500 bg-emerald-50 text-emerald-800 font-medium";
                        } else if (isSelected && !opt.is_correct) {
                          optionClasses = "border-rose-500 bg-rose-50 text-rose-800";
                        } else {
                          optionClasses = "border-slate-100 opacity-60";
                        }
                      }

                      return (
                        <div key={opt.id} onClick={() => handleSelectOption(q.id, opt.id)} className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3", optionClasses, isCompleted && "cursor-default")}>
                          <div
                            className={cn(
                              "size-5 rounded-full border-2 flex flex-shrink-0 items-center justify-center",
                              isSelected && !isCompleted ? "border-purple-500 bg-purple-500" : "border-slate-300",
                              isCompleted && opt.is_correct ? "border-emerald-500 bg-emerald-500" : "",
                              isCompleted && isSelected && !opt.is_correct ? "border-rose-500 bg-rose-500" : "",
                            )}
                          >
                            {((isSelected && !isCompleted) || (isCompleted && opt.is_correct) || (isCompleted && isSelected)) && <div className="size-2 bg-white rounded-full" />}
                          </div>
                          <span className="flex-1 text-slate-700">{opt.option_text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TOMBOL SUBMIT */}
      {!isCompleted && quiz.quiz_questions.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky bottom-6 z-10 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">
            Terjawab: <span className="text-purple-600 font-bold">{Object.keys(answers).length}</span> / {quiz.quiz_questions.length}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < quiz.quiz_questions.length}
            className="h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-md font-bold text-white shadow-md transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" /> Menghitung...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" /> Kumpulkan Kuis
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
