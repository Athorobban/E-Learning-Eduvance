import { z } from "zod";

/* Question schema:
   - question_text: string
   - options: array of 4 strings
   - correctIndex: number (0..3)
*/
const questionSchema = z.object({
  question_text: z.string().min(1, "Pertanyaan tidak boleh kosong"),
  options: z.array(z.string().min(1, "Pilihan tidak boleh kosong")).length(4, "Harus ada 4 pilihan"),
  correctIndex: z.number().int().min(0).max(3, "Index jawaban benar harus antara 0-3"),
});

export const quizFormSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, "Minimal 1 pertanyaan"),
});

export type QuizForm = z.infer<typeof quizFormSchema>;

/* Server-side minimal validation for DB insert/update (title + description) */
export const quizSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});
