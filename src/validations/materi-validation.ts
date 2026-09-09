import z from "zod";

export const materiFormSchema = z.object({
  judul: z.string().min(1, "Judul materi tidak boleh kosong"),
  deskripsi: z.string().optional(),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  pertemuan: z.number().min(1, "Pertemuan harus minimal 1"),
  kategori: z.string().min(1, "Kategori wajib diisi"),

  // File materi (PDF/DOC) – bisa string URL atau file upload
  file_url: z.union([z.string().url().optional(), z.instanceof(File)]).optional(),

  // Video materi (bebas URL YouTube/Storage)
  video_url: z.string().url().optional(),

  // Thumbnail materi (URL atau gambar upload)
  thumbnail_url: z.union([z.string().url().optional(), z.instanceof(File)]).optional(),
});

export const materiSchema = z.object({
  judul: z.string(),
  deskripsi: z.string(),
  kelas: z.string(),
  pertemuan: z.number(),
  kategori: z.string(),
  file_url: z.union([z.string(), z.instanceof(File)]),
  video_url: z.string().optional(),
  thumbnail_url: z.union([z.string(), z.instanceof(File)]).optional(),
});

export type MateriForm = z.infer<typeof materiFormSchema>;
export type Materi = z.infer<typeof materiSchema> & { id: string };
