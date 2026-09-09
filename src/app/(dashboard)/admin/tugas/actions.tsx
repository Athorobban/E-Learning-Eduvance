"use server";

import { deleteFile, uploadFile } from "@/actions/storage-action";
import { createClient } from "@/lib/supabase/server";
import { tugasFormSchema } from "@/validations/tugas-validation";
import { TugasFormState } from "@/types/tugas";

export async function createTugas(formData: FormData): Promise<TugasFormState> {
  const validated = tugasFormSchema.safeParse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi"),
    deadline: formData.get("deadline"),
    file_url: formData.get("file_url"),
  });

  if (!validated.success) {
    return {
      status: "error",
      errors: {
        ...validated.error.flatten().fieldErrors,
        _form: ["Validasi form gagal"],
      },
    };
  }

  let fileUrl: string | null = null;

  if (validated.data.file_url instanceof File) {
    const { data, errors } = await uploadFile("files", "tugas", validated.data.file_url);

    if (errors) {
      return {
        status: "error",
        errors: { _form: ["Gagal upload file"] },
      };
    }

    fileUrl = data.url;
  }

  const supabase = await createClient();
  const auth = await supabase.auth.getUser();

  const { error } = await supabase.from("tugas").insert({
    judul: validated.data.judul,
    deskripsi: validated.data.deskripsi || null,
    deadline: validated.data.deadline || null,
    file_url: fileUrl,
    guru_id: auth.data.user?.id,
  });

  if (error) {
    return {
      status: "error",
      errors: {
        _form: [error.message],
      },
    };
  }

  return {
    status: "success",
    errors: {},
  };
}

export async function updateTugas(formData: FormData): Promise<TugasFormState> {
  const id = String(formData.get("id") ?? "");

  const validated = tugasFormSchema.safeParse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi"),
    deadline: formData.get("deadline"),
    file_url: formData.get("file_url"),
  });

  if (!validated.success) {
    return {
      status: "error",
      errors: { ...validated.error.flatten().fieldErrors, _form: [] },
    };
  }

  let fileUrl = String(formData.get("old_file_url") ?? null);

  // jika file baru diupload -> upload dan replace
  if (validated.data.file_url instanceof File) {
    const oldFile = String(formData.get("old_file_url") ?? "");
    // ambil oldPath seperti pola yang kamu pakai saat upload (sesuaikan jika folder berbeda)
    const oldPath = oldFile ? oldFile.split("/tugas/")[1] : undefined;

    // uploadFile(bucket, folder, file, oldPath?) -- pastikan implementasi uploadFile mendukung arg ke-4
    const { data, errors } = await uploadFile("files", "tugas", validated.data.file_url, oldPath);

    if (errors) {
      return {
        status: "error",
        errors: { _form: [...(errors._form || [])] },
      };
    }

    fileUrl = data.url ?? null;
  }

  // update row
  const supabase = await createClient();
  const { error } = await supabase
    .from("tugas")
    .update({
      judul: validated.data.judul,
      deskripsi: validated.data.deskripsi ?? null,
      deadline: validated.data.deadline ?? null,
      file_url: fileUrl ?? null,
    })
    .eq("id", id);

  if (error) {
    return {
      status: "error",
      errors: { _form: [error.message] },
    };
  }

  return { status: "success", errors: {} };
}

export async function deleteTugas(prevState: TugasFormState, formData: FormData): Promise<TugasFormState> {
  const id = String(formData.get("id") ?? "");
  const fileUrl = String(formData.get("file_url") ?? "");

  const oldPath = fileUrl ? fileUrl.split("/tugas/")[1] : undefined;

  // hapus file bila ada
  if (oldPath) {
    const { errors } = await deleteFile("files", `tugas/${oldPath}`);
    if (errors) {
      return {
        status: "error",
        errors: { _form: [...(errors._form || [])] },
      };
    }
  }

  // hapus row dari DB
  const supabase = await createClient();
  const { error } = await supabase.from("tugas").delete().eq("id", id);

  if (error) {
    return {
      status: "error",
      errors: { _form: [error.message] },
    };
  }

  return { status: "success", errors: {} };
}
