"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const gradeSubmissionSchema = z.object({
  pengumpulan_id: z.string().uuid("ID pengumpulan tidak valid."),
  nilai: z.coerce.number({ error: "Nilai harus berupa angka." }).int("Nilai harus berupa bilangan bulat.").min(0, "Nilai minimal adalah 0.").max(100, "Nilai maksimal adalah 100."),
  catatan_guru: z.string().max(2000, "Catatan guru maksimal 2.000 karakter.").optional(),
});

export type GradeActionResult = { status: "success"; message: string } | { status: "error"; message: string };

export async function gradeTugasSubmission(payload: { pengumpulan_id: string; nilai: number; catatan_guru?: string }): Promise<GradeActionResult> {
  const supabase = await createClient();

  // 1. Verifikasi sesi autentikasi
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

  // 2. Verifikasi otorisasi role Admin atau Guru
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profileError || !profile || !["Admin", "Guru"].includes(profile.role)) {
    return {
      status: "error",
      message: "Anda tidak memiliki izin untuk memberikan penilaian.",
    };
  }

  // 3. Validasi input nilai dan catatan
  const parsed = gradeSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message || "Data penilaian tidak valid.",
    };
  }

  const { pengumpulan_id, nilai, catatan_guru } = parsed.data;

  // 4. Update tabel public.tugas_pengumpulan sesuai skema 003-tugas.sql
  const { error: updateError } = await supabase
    .from("tugas_pengumpulan")
    .update({
      nilai,
      catatan_guru: catatan_guru?.trim() || null,
      status: "graded",
      graded_at: new Date().toISOString(),
    })
    .eq("id", pengumpulan_id);

  if (updateError) {
    return {
      status: "error",
      message: `Gagal menyimpan nilai: ${updateError.message}`,
    };
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/admin/tugas/pengumpulan");
  revalidatePath("/dashboard-siswa/tugas");
  revalidatePath("/dashboard-siswa/tugas/answer-assignment");

  return {
    status: "success",
    message: "Nilai dan catatan evaluasi berhasil disimpan.",
  };
}
