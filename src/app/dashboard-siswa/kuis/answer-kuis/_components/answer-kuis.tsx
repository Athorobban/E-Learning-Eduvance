"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileQuestion, GraduationCap, Loader2, Send, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitQuizAction } from "../actions";

type AnswerQuizProps = {
  initialQuizId?: string;
};

interface QuizOptionListItem {
  id: string;
  title: string;
}

interface QuizAnswerOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
  created_at?: string;
}

interface QuizQuestionItem {
  id: string;
  question_text: string;
  created_at?: string;
  quiz_options: QuizAnswerOption[];
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  quiz_questions: QuizQuestionItem[];
}

interface QuizAttemptDetail {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  started_at: string;
  completed_at: string | null;
  quiz_attempt_answers: Array<{
    question_id: string;
    option_id: string;
  }>;
}

export default function AnswerQuizPage({ initialQuizId }: AnswerQuizProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    if (initialQuizId) {
      setSelectedQuizId(initialQuizId);
    }
  }, [initialQuizId]);

  // 1. Ambil daftar kuis untuk navigasi cepat & fallback jika dibuka tanpa ?id=
  const { data: quizOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["kuis-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("id, title").order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as QuizOptionListItem[];
    },
  });

  useEffect(() => {
    if (!selectedQuizId && quizOptions && quizOptions.length > 0) {
      const defaultId = quizOptions[0].id;
      setSelectedQuizId(defaultId);
      router.replace(`/dashboard-siswa/kuis/answer-kuis?id=${defaultId}`);
    }
  }, [selectedQuizId, quizOptions, router]);

  // 2. Fetch detail kuis dan status attempt siswa
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["kuis-detail", selectedQuizId],
    enabled: Boolean(selectedQuizId),
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
      }

      // Cek riwayat pengerjaan siswa terlebih dahulu menggunakan maybeSingle()
      const { data: attemptData, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_id, student_id, score, started_at, completed_at, quiz_attempt_answers(question_id, option_id)")
        .eq("quiz_id", selectedQuizId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (attemptError) {
        throw new Error("Gagal memuat status pengerjaan kuis.");
      }

      const isAlreadyCompleted = Boolean(attemptData?.completed_at);

      // Hanya sertakan kolom is_correct apabila kuis SUDAH selesai dikerjakan (anti-cheat)
      const selectFields = isAlreadyCompleted
        ? `
            id,
            title,
            description,
            created_at,
            quiz_questions (
              id,
              question_text,
              created_at,
              quiz_options (id, option_text, is_correct, created_at)
            )
          `
        : `
            id,
            title,
            description,
            created_at,
            quiz_questions (
              id,
              question_text,
              created_at,
              quiz_options (id, option_text, created_at)
            )
          `;

      const { data: quizData, error: quizError } = await supabase.from("quizzes").select(selectFields).eq("id", selectedQuizId).single();

      if (quizError || !quizData) {
        throw new Error("Kuis tidak ditemukan atau Anda tidak memiliki akses.");
      }

      const typedQuiz = quizData as unknown as QuizDetail;

      // Urutkan pertanyaan & opsi secara konsisten berdasarkan waktu pembuatan
      const sortedQuestions = [...(typedQuiz.quiz_questions ?? [])]
        .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
        .map((q) => ({
          ...q,
          quiz_options: [...(q.quiz_options ?? [])].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
        }));

      return {
        quiz: {
          ...typedQuiz,
          quiz_questions: sortedQuestions,
        },
        attempt: (attemptData as QuizAttemptDetail | null) ?? null,
      };
    },
  });

  // Reset atau muat jawaban terdahulu saat kuis berubah / selesai dimuat
  useEffect(() => {
    if (data?.attempt?.quiz_attempt_answers) {
      const pastAnswers: Record<string, string> = {};
      data.attempt.quiz_attempt_answers.forEach((ans) => {
        pastAnswers[ans.question_id] = ans.option_id;
      });
      setAnswers(pastAnswers);
    } else {
      setAnswers({});
      setStartedAt(new Date().toISOString());
    }
  }, [selectedQuizId, data?.attempt]);

  const handleSelectQuiz = (newId: string) => {
    setSelectedQuizId(newId);
    router.replace(`/dashboard-siswa/kuis/answer-kuis?id=${newId}`);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (data?.attempt?.completed_at) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // 3. Submit jawaban kuis melalui Server Action
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuizId || !data?.quiz) {
        throw new Error("Data kuis tidak valid.");
      }

      const totalQuestions = data.quiz.quiz_questions.length;
      if (Object.keys(answers).length < totalQuestions) {
        throw new Error("Harap jawab seluruh pertanyaan sebelum mengumpulkan kuis.");
      }

      const result = await submitQuizAction({
        quiz_id: selectedQuizId,
        started_at: startedAt,
        answers,
      });

      if (result.status === "error") {
        throw new Error(result.message);
      }

      return result;
    },
    onSuccess: (res) => {
      toast.success("Kuis Berhasil Diselesaikan!", {
        description: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ["kuis-detail", selectedQuizId] });
      queryClient.invalidateQueries({ queryKey: ["kuis-siswa"] });
    },
    onError: (err: Error) => {
      toast.error("Gagal Mengumpulkan Kuis", {
        description: err.message,
      });
    },
  });

  const answeredCount = useMemo(() => {
    if (!data?.quiz) return 0;
    return data.quiz.quiz_questions.filter((q) => Boolean(answers[q.id])).length;
  }, [data?.quiz, answers]);

  if (isLoadingOptions || (Boolean(selectedQuizId) && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-purple-600" />
        <p className="font-medium animate-pulse">Menyiapkan lembar soal...</p>
      </div>
    );
  }

  if (!isLoadingOptions && (!quizOptions || quizOptions.length === 0)) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="size-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <GraduationCap className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Belum Ada Kuis Tersedia</h2>
        <p className="text-sm text-slate-500">Guru belum menerbitkan kuis untuk dikerjakan.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard-siswa/kuis">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Daftar Kuis
          </Link>
        </Button>
      </div>
    );
  }

  if (isError || !data?.quiz) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="size-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Kuis Tidak Dapat Dimuat</h2>
        <p className="text-sm text-slate-500">{error instanceof Error ? error.message : "Kuis tidak ditemukan atau akses ditolak."}</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard-siswa/kuis">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Daftar Kuis
          </Link>
        </Button>
      </div>
    );
  }

  const { quiz, attempt } = data;
  const isCompleted = Boolean(attempt?.completed_at);
  const totalQuestions = quiz.quiz_questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* BAR NAVIGASI & PILIH KUIS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/dashboard-siswa/kuis" className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors font-medium">
          <ArrowLeft className="size-4" /> Kembali ke Daftar Kuis
        </Link>

        {quizOptions && quizOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="select-kuis" className="text-xs font-semibold text-slate-500 shrink-0">
              Pilih Kuis:
            </label>
            <select
              id="select-kuis"
              value={selectedQuizId}
              onChange={(e) => handleSelectQuiz(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 max-w-xs"
            >
              {quizOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* HEADER INFO KUIS & SKOR */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl inline-block mb-4">
              <FileQuestion className="size-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{quiz.title}</h1>
            {quiz.description && <p className="mt-2 text-slate-600 whitespace-pre-line">{quiz.description}</p>}
          </div>

          {isCompleted && attempt && (
            <div className="shrink-0 bg-purple-50 p-5 rounded-2xl border border-purple-200 text-center min-w-[135px]">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Skor Akhir</p>
              <div className="text-4xl font-black text-purple-700 flex items-baseline justify-center gap-1">
                {attempt.score}
                <span className="text-base font-bold text-purple-400">/100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DAFTAR SOAL */}
      <div className="space-y-6">
        {totalQuestions === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500">Belum ada pertanyaan di dalam kuis ini.</div>
        ) : (
          quiz.quiz_questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex gap-4">
                <div className="shrink-0 size-8 bg-slate-100 text-slate-700 font-bold flex items-center justify-center rounded-full text-sm">{index + 1}</div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-800 leading-relaxed mb-4">{q.question_text}</h3>

                  <div className="space-y-3">
                    {q.quiz_options.map((opt) => {
                      const isSelected = answers[q.id] === opt.id;

                      let optionClasses = "border-slate-200 hover:border-purple-300 hover:bg-purple-50/40";

                      if (isSelected && !isCompleted) {
                        optionClasses = "border-purple-500 bg-purple-50 ring-1 ring-purple-500";
                      }

                      if (isCompleted) {
                        if (opt.is_correct) {
                          optionClasses = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium";
                        } else if (isSelected && !opt.is_correct) {
                          optionClasses = "border-rose-500 bg-rose-50 text-rose-900";
                        } else {
                          optionClasses = "border-slate-100 opacity-65";
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isCompleted || submitMutation.isPending}
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          className={cn("w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3", optionClasses, isCompleted ? "cursor-default" : "cursor-pointer")}
                        >
                          <div
                            className={cn(
                              "size-5 rounded-full border-2 flex shrink-0 items-center justify-center",
                              isSelected && !isCompleted ? "border-purple-600 bg-purple-600" : "border-slate-300",
                              isCompleted && opt.is_correct ? "border-emerald-600 bg-emerald-600" : "",
                              isCompleted && isSelected && !opt.is_correct ? "border-rose-600 bg-rose-600" : "",
                            )}
                          >
                            {((isSelected && !isCompleted) || (isCompleted && opt.is_correct) || (isCompleted && isSelected)) && <div className="size-2 bg-white rounded-full" />}
                          </div>

                          <span className="flex-1 text-slate-700">{opt.option_text}</span>

                          {isCompleted && opt.is_correct && <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />}
                          {isCompleted && isSelected && !opt.is_correct && <XCircle className="size-5 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BAR SUBMIT STICKY */}
      {!isCompleted && totalQuestions > 0 && (
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-md border border-slate-200 sticky bottom-6 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600">
            Terjawab:{" "}
            <span className="text-purple-600 font-bold">
              {answeredCount} / {totalQuestions}
            </span>{" "}
            pertanyaan
          </div>

          <Button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || answeredCount < totalQuestions}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-md font-bold text-white shadow-md transition-all"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" /> Menghitung Nilai...
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
