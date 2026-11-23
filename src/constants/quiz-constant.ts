import { QuizForm } from "@/validations/quiz-validation";

export const HEADER_TABLE_QUIZ = ["No", "Kuis", "Dibuat Pada", "Aksi"];

export const INITIAL_QUIZ: QuizForm = {
  title: "",
  description: "",
  questions: [
    {
      question_text: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    },
  ],
};

export type QuizActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export const INITIAL_STATE_QUIZ = {
  status: "",
  errors: {
    id: [],
    title: [],
    description: [],
    _form: [],
  },
};
