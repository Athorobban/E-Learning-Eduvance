"use server";

import { revalidatePath } from "next/cache";
import { deleteFile, uploadFile } from "@/actions/storage-action";
import { createClient } from "@/lib/supabase/server";
import { tugasFormSchema } from "@/validations/tugas-validation";
import { TugasFormState } from "@/types/tugas";

export async function createTugas(formData: FormData): Promise<TugasFormState> {
  const supabase = await createClient();

  // 1. Validasi sesi autentikasi terlebih dahulu sebelum operasi storage/DB
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      errors: { _form: ["Sesi login berakhir. Silakan login kembali."] },
    };
  }

  // 2. Validasi input dengan Zod
  const rawFile = formData.get("file_url");
  const validated = tugasFormSchema.safeParse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi"),
    deadline: formData.get("deadline"),
    file_url: rawFile instanceof File && rawFile.size > 0 ? rawFile : undefined,
  });

  if (!validated.success) {
    return {
      status: "error",
      errors: {
        ...validated.error.flatten().fieldErrors,
        _form: ["Validasi form gagal. Periksa kembali input Anda."],
      },
    };
  }

  let fileUrl: string | null = null;
  let uploadedFilePath: string | null = null;

  // 3. Upload file jika ada dan ukurannya valid (> 0 bytes)
  if (validated.data.file_url instanceof File && validated.data.file_url.size > 0) {
    const { data, errors } = await uploadFile("files", "tugas", validated.data.file_url);

    if (errors || !data?.url) {
      return {
        status: "error",
        errors: { _form: ["Gagal mengunggah file lampiran tugas."] },
      };
    }

    fileUrl = data.url;
    uploadedFilePath = data.url.split("/tugas/")[1] ?? null;
  }

  // 4. Insert ke tabel public.tugas sesuai skema 003-tugas.sql
  const { error: insertError } = await supabase.from("tugas").insert({
    guru_id: user.id,
    judul: validated.data.judul.trim(),
    deskripsi: validated.data.deskripsi?.trim() || null,
    deadline: validated.data.deadline || null,
    file_url: fileUrl,
  });

  if (insertError) {
    // Rollback file di storage jika insert DB gagal agar tidak menjadi file yatim
    if (uploadedFilePath) {
      await deleteFile("files", `tugas/${uploadedFilePath}`);
    }

    return {
      status: "error",
      errors: { _form: [insertError.message] },
    };
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/dashboard-siswa/tugas");

  return {
    status: "success",
    errors: {},
  };
}

export async function updateTugas(formData: FormData): Promise<TugasFormState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      errors: { _form: ["Sesi login berakhir. Silakan login kembali."] },
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return {
      status: "error",
      errors: { _form: ["ID tugas tidak valid."] },
    };
  }

  const rawFile = formData.get("file_url");
  const validated = tugasFormSchema.safeParse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi"),
    deadline: formData.get("deadline"),
    file_url: rawFile instanceof File && rawFile.size > 0 ? rawFile : undefined,
  });

  if (!validated.success) {
    return {
      status: "error",
      errors: { ...validated.error.flatten().fieldErrors, _form: [] },
    };
  }

  // Normalisasi old_file_url agar tidak berubah menjadi string "null"
  const rawOldFile = formData.get("old_file_url");
  let fileUrl: string | null = typeof rawOldFile === "string" && rawOldFile !== "" && rawOldFile !== "null" ? rawOldFile : null;

  if (validated.data.file_url instanceof File && validated.data.file_url.size > 0) {
    const oldPath = fileUrl ? fileUrl.split("/tugas/")[1] : undefined;
    const { data, errors } = await uploadFile("files", "tugas", validated.data.file_url, oldPath);

    if (errors || !data?.url) {
      return {
        status: "error",
        errors: { _form: [...(errors?._form || ["Gagal memperbarui file tugas."])] },
      };
    }

    fileUrl = data.url;
  }

  const { error: updateError } = await supabase
    .from("tugas")
    .update({
      judul: validated.data.judul.trim(),
      deskripsi: validated.data.deskripsi?.trim() || null,
      deadline: validated.data.deadline || null,
      file_url: fileUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return {
      status: "error",
      errors: { _form: [updateError.message] },
    };
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/dashboard-siswa/tugas");

  return { status: "success", errors: {} };
}

export async function deleteTugas(prevState: TugasFormState, formData: FormData): Promise<TugasFormState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      errors: { _form: ["Sesi login berakhir. Silakan login kembali."] },
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  const rawFileUrl = formData.get("file_url");
  const fileUrl = typeof rawFileUrl === "string" && rawFileUrl !== "null" ? rawFileUrl : "";

  const oldPath = fileUrl ? fileUrl.split("/tugas/")[1] : undefined;

  if (oldPath) {
    const { errors } = await deleteFile("files", `tugas/${oldPath}`);
    if (errors) {
      return {
        status: "error",
        errors: { _form: [...(errors._form || ["Gagal menghapus file dari storage."])] },
      };
    }
  }

  const { error: deleteError } = await supabase.from("tugas").delete().eq("id", id);

  if (deleteError) {
    return {
      status: "error",
      errors: { _form: [deleteError.message] },
    };
  }

  revalidatePath("/admin/tugas");
  revalidatePath("/dashboard-siswa/tugas");

  return { status: "success", errors: {} };
}
