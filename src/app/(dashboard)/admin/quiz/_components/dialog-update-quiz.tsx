"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, startTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateQuiz } from "../actions";
import { quizFormSchema, QuizForm } from "@/validations/quiz-validation";
import FormQuiz from "./form-quiz";
import { Dialog } from "@radix-ui/react-dialog";
import { INITIAL_STATE_QUIZ } from "@/constants/quiz-constant";

export default function DialogUpdateQuiz({ refetch, currentData, open, handleChangeAction }: { refetch: () => void; currentData?: any; open?: boolean; handleChangeAction?: (open: boolean) => void }) {
  const form = useForm<QuizForm>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { title: "", description: "", questions: [] },
  });

  // useActionState dari React
  const [state, action, isPending] = useActionState(updateQuiz, INITIAL_STATE_QUIZ);

  /* Load data ketika dialog dibuka */
  useEffect(() => {
    if (!currentData) return;

    const mappedQuestions = (currentData.questions || []).map((q: any) => {
      const opts = q.options || [];
      return {
        question_text: q.question_text,
        options: opts.map((o: any) => o.option_text),
        correctIndex: opts.findIndex((o: any) => o.is_correct) || 0,
      };
    });

    form.setValue("title", currentData.title);
    form.setValue("description", currentData.description);
    form.setValue("questions", mappedQuestions);
  }, [currentData]);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.append("id", currentData?.id ?? "");
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("questions", JSON.stringify(data.questions));

    startTransition(() => {
      action(formData);
    });
  });

  /* HANDLE RESPONSE */
  useEffect(() => {
    if (state?.status === "error") {
      toast.error("Gagal update kuis", { description: state.errors?._form?.[0] });
    }

    if (state?.status === "success") {
      toast.success("Berhasil update kuis");
      handleChangeAction?.(false);
      refetch();
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={handleChangeAction}>
      <FormQuiz form={form} onSubmit={onSubmit} isLoading={isPending} type="Update" />
    </Dialog>
  );
}
