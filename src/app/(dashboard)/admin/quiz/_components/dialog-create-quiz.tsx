"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createQuiz } from "../actions";
import FormQuiz from "./form-quiz";
import { quizFormSchema, QuizForm } from "@/validations/quiz-validation";
import { INITIAL_QUIZ } from "@/constants/quiz-constant";

type DialogCreateQuizProps = {
  refetch: () => void;
  onSuccess?: () => void;
};

function extractFirstFormError(errors: FieldErrors<QuizForm>): string {
  if (errors.title?.message) return errors.title.message;
  if (errors.description?.message) return errors.description.message;
  if (errors.questions?.message) return errors.questions.message;
  if (errors.questions?.root?.message) return errors.questions.root.message;

  if (Array.isArray(errors.questions)) {
    for (let i = 0; i < errors.questions.length; i++) {
      const qErr = errors.questions[i];
      if (!qErr) continue;

      if (qErr.question_text?.message) {
        return `Soal #${i + 1}: ${qErr.question_text.message}`;
      }
      if (qErr.correctIndex?.message) {
        return `Soal #${i + 1}: ${qErr.correctIndex.message}`;
      }
      if (Array.isArray(qErr.options)) {
        const optionErrors = qErr.options as Array<{ message?: string } | undefined>;
        for (const opt of optionErrors) {
          if (opt?.message) {
            return `Soal #${i + 1}: ${opt.message}`;
          }
        }
      }
    }
  }

  return "Periksa kembali seluruh isian kuis dan opsi jawaban.";
}

export default function DialogCreateQuiz({ refetch, onSuccess }: DialogCreateQuizProps) {
  const form = useForm<QuizForm>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: INITIAL_QUIZ,
  });

  const [isLoading, setIsLoading] = useState(false);

  const onValid = (data: QuizForm) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("questions", JSON.stringify(data.questions));

    setIsLoading(true);

    startTransition(() => {
      createQuiz(formData)
        .then((res) => {
          setIsLoading(false);

          if (res.status === "error") {
            toast.error("Gagal membuat kuis", {
              description: res.message || "Terjadi kesalahan saat menyimpan kuis.",
            });
            return;
          }

          toast.success("Kuis berhasil dibuat", {
            description: res.message,
          });
          form.reset(INITIAL_QUIZ);
          refetch();
          onSuccess?.();
        })
        .catch(() => {
          setIsLoading(false);
          toast.error("Gagal membuat kuis", {
            description: "Terjadi gangguan koneksi ke server.",
          });
        });
    });
  };

  const onInvalid = (errors: FieldErrors<QuizForm>) => {
    toast.error("Form kuis belum lengkap", {
      description: extractFirstFormError(errors),
    });
  };

  const onSubmit = form.handleSubmit(onValid, onInvalid);

  return <FormQuiz form={form} onSubmit={onSubmit} isLoading={isLoading} type="Create" />;
}
