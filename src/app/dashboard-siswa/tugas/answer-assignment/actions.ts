"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp"];

const submitPayloadSchema = z.object({
  tugas_id: z.string().uuid("ID tugas tidak valid."),
  jawaban_teks: z.string().max(10000, "Jawaban teks maksimal 10.000 karakter.").optional(),
});

export type SubmitAssignmentResult = { status: "success"; message: string } | { status: "error"; message: string };

export async function submitAssignmentAction(formData: FormData): Promise<SubmitAssignmentResult> {
  const supabase = await createClient();

  // 1. Validasi sesi autentikasi siswa
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      message: "Sesi login berakhir. Silakan login kembali.",
    };
  }

  // 2. Validasi payload dasar
  const parsed = submitPayloadSchema.safeParse({
    tugas_id: formData.get("tugas_id"),
    jawaban_teks: typeof formData.get("jawaban_teks") === "string" ? formData.get("jawaban_teks") : "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message || "Data pengumpulan tidak valid.",
    };
  }

  const { tugas_id } = parsed.data;
  const trimmedJawaban = (parsed.data.jawaban_teks ?? "").trim();
  const rawFile = formData.get("file");
  const uploadedFile = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  // 3. Validasi file jika siswa melampirkan file baru
  if (uploadedFile) {
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return { status: "error", message: "Ukuran file maksimal 10 MB." };
    }
    if (!ALLOWED_MIME_TYPES.includes(uploadedFile.type)) {
      return {
        status: "error",
        message: "Format file harus berupa PDF, DOC, DOCX, JPG, PNG, atau WEBP.",
      };
    }
  }

  // 4. Ambil detail tugas & pengumpulan sebelumnya untuk validasi status dan deadline
  const [{ data: tugasData, error: tugasError }, { data: existingSubmission }] = await Promise.all([
    supabase.from("tugas").select("id, deadline").eq("id", tugas_id).single(),
    supabase.from("tugas_pengumpulan").select("id, status, file_url").eq("tugas_id", tugas_id).eq("siswa_id", user.id).maybeSingle(),
  ]);

  if (tugasError || !tugasData) {
    return { status: "error", message: "Tugas tidak ditemukan." };
  }

  if (existingSubmission?.status === "graded") {
    return { status: "error", message: "Tugas sudah dinilai dan tidak dapat diubah lagi." };
  }

  if (tugasData.deadline && new Date() > new Date(tugasData.deadline)) {
    return { status: "error", message: "Batas waktu pengumpulan tugas telah berakhir." };
  }

  let finalFileUrl: string | null = existingSubmission?.file_url ?? null;

  if (!trimmedJawaban && !uploadedFile && !finalFileUrl) {
    return {
      status: "error",
      message: "Harap isi jawaban teks atau unggah file jawaban terlebih dahulu.",
    };
  }

  // 5. Proses upload file ke Supabase Storage
  let activeBucket: string | null = null;
  let uploadedPath: string | null = null;

  if (uploadedFile) {
    const sanitizedExt =
      uploadedFile.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "pdf";
    const uniqueFileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${sanitizedExt}`;
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    // Coba unggah ke bucket 'tugas-files', fallback ke bucket 'files' jika bucket belum dibuat
    const primaryPath = `jawaban/${tugas_id}/${user.id}/${uniqueFileName}`;
    const primaryUpload = await supabase.storage.from("tugas-files").upload(primaryPath, fileBuffer, {
      contentType: uploadedFile.type,
      cacheControl: "3600",
      upsert: false,
    });

    if (!primaryUpload.error) {
      activeBucket = "tugas-files";
      uploadedPath = primaryPath;
    } else if (primaryUpload.error.message.toLowerCase().includes("bucket not found")) {
      const fallbackPath = `jawaban-tugas/${tugas_id}/${user.id}/${uniqueFileName}`;
      const fallbackUpload = await supabase.storage.from("files").upload(fallbackPath, fileBuffer, {
        contentType: uploadedFile.type,
        cacheControl: "3600",
        upsert: false,
      });

      if (fallbackUpload.error) {
        return {
          status: "error",
          message: `Gagal mengunggah file: ${fallbackUpload.error.message}`,
        };
      }

      activeBucket = "files";
      uploadedPath = fallbackPath;
    } else {
      return {
        status: "error",
        message: `Gagal mengunggah file: ${primaryUpload.error.message}`,
      };
    }

    const { data: publicUrlData } = supabase.storage.from(activeBucket).getPublicUrl(uploadedPath);
    finalFileUrl = publicUrlData.publicUrl;
  }

  // 6. Simpan ke tabel public.tugas_pengumpulan
  const { error: dbError } = await supabase.from("tugas_pengumpulan").upsert(
    {
      tugas_id,
      siswa_id: user.id,
      jawaban_teks: trimmedJawaban || null,
      file_url: finalFileUrl,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    },
    {
      onConflict: "tugas_id,siswa_id",
    },
  );

  if (dbError) {
    // Rollback file yang baru diunggah jika insert/upsert database gagal
    if (activeBucket && uploadedPath) {
      await supabase.storage.from(activeBucket).remove([uploadedPath]);
    }

    return {
      status: "error",
      message: `Gagal menyimpan jawaban: ${dbError.message}`,
    };
  }

  revalidatePath("/dashboard-siswa/tugas");
  revalidatePath("/dashboard-siswa/tugas/answer-assignment");
  revalidatePath("/admin/tugas");

  return {
    status: "success",
    message: "Jawaban tugas berhasil dikumpulkan.",
  };
}
