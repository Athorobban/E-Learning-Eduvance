import { z } from "zod";

export const tugasFormSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  deskripsi: z.string().optional(),
  deadline: z.string().optional(),
  file_url: z.any().optional(), // File | string | null
});

export const tugasSchema = z.object({
  judul: z.string(),
  deskripsi: z.string(),
  deadline: z.string(),
  file_url: z.string(),
});

export type TugasForm = z.infer<typeof tugasFormSchema>;
export type Tugas = z.infer<typeof tugasSchema> & { id: string };
