"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, startTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createQuiz } from "../actions";
import FormQuiz from "./form-quiz";

import { quizFormSchema, QuizForm } from "@/validations/quiz-validation";
import { INITIAL_QUIZ, INITIAL_STATE_QUIZ } from "@/constants/quiz-constant";

export default function DialogCreateQuiz({ refetch }: { refetch: () => void }) {
  const form = useForm<QuizForm>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: INITIAL_QUIZ,
  });

  // pakai useActionState bawaan React
  const [state, action, isPending] = useActionState(createQuiz, INITIAL_STATE_QUIZ);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("questions", JSON.stringify(data.questions));

    startTransition(() => {
      action(formData);
    });
  });

  useEffect(() => {
    if (state?.status === "error") {
      toast.error("Gagal membuat kuis", { description: state.errors?._form?.[0] });
    }
    if (state?.status === "success") {
      toast.success("Kuis berhasil dibuat");
      form.reset();
      document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      refetch();
    }
  }, [state]);

  return <FormQuiz form={form} onSubmit={onSubmit} isLoading={isPending} type="Create" />;
}
