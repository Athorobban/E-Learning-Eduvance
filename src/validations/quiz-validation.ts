import { z } from "zod";

export const quizQuestionSchema = z
  .object({
    question_text: z.string().trim().min(1, "Teks pertanyaan wajib diisi."),
    options: z.array(z.string().trim().min(1, "Teks opsi jawaban tidak boleh kosong.")).min(2, "Minimal harus terdapat 2 pilihan jawaban."),
    correctIndex: z.number().int("Indeks jawaban benar harus berupa bilangan bulat.").min(0, "Pilihan jawaban benar tidak valid."),
  })
  .refine((data) => data.correctIndex < data.options.length, {
    message: "Indeks jawaban benar melebihi jumlah opsi.",
    path: ["correctIndex"],
  });

export const quizSchema = z.object({
  title: z.string().trim().min(3, "Judul kuis minimal 3 karakter.").max(200, "Judul kuis maksimal 200 karakter."),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2.000 karakter.").optional().or(z.literal("")),
});

export const quizFormSchema = quizSchema.extend({
  questions: z.array(quizQuestionSchema).min(1, "Minimal harus membuat 1 pertanyaan."),
});

export type QuizQuestionForm = z.infer<typeof quizQuestionSchema>;
export type QuizForm = z.infer<typeof quizFormSchema>;
