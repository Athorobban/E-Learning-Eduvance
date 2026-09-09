"use server";

import { deleteFile, uploadFile } from "@/actions/storage-action";
import { createClient } from "@/lib/supabase/server";
import { materiSchema } from "@/validations/materi-validation";

type PrevState = {
  status?: string;
  errors?: Record<string, any>;
};

export async function createMateri(prevState: PrevState, formData: FormData) {
  // parse and validate
  let validated = materiSchema.safeParse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi"),
    kelas: formData.get("kelas"),
    pertemuan: Number(formData.get("pertemuan")),
    kategori: formData.get("kategori"),
    video_url: formData.get("video_url"),
    file_url: formData.get("file_url"),
    thumbnail_url: formData.get("thumbnail_url"),
  });

  if (!validated.success) {
    return { status: "error", errors: { ...validated.error.flatten().fieldErrors, _form: [] } };
  }

  // upload file jika File
  if (validated.data.file_url instanceof File) {
    const { data, errors } = await uploadFile("files", "materi/files", validated.data.file_url);
    if (errors) return { status: "error", errors: { ...prevState.errors, _form: [...(errors._form || [])] } };
    validated = { ...validated, data: { ...validated.data, file_url: data.url } };
  }

  // upload thumbnail jika File
  if (validated.data.thumbnail_url instanceof File) {
    const { data, errors } = await uploadFile("images", "materi/thumbnails", validated.data.thumbnail_url);
    if (errors) return { status: "error", errors: { ...prevState.errors, _form: [...(errors._form || [])] } };
    validated = { ...validated, data: { ...validated.data, thumbnail_url: data.url } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("materi").insert({
    judul: validated.data.judul,
    deskripsi: validated.data.deskripsi ?? null,
    kelas: validated.data.kelas ?? null,
    pertemuan: validated.data.pertemuan ?? null,
    kategori: validated.data.kategori ?? null,
    file_url: validated.data.file_url ?? null,
    video_url: validated.data.video_url ?? null,
    thumbnail_url: validated.data.thumbnail_url ?? null,
  });

  if (error) return { status: "error", errors: { ...prevState.errors, _form: [error.message] } };

  return { status: "success" };
}

export async function updateMateri(prevState: PrevState, formData: FormData) {
  const id = String(formData.get("id") ?? "");

  let validated = materiSchema.safeParse({
    judul: formData.get("judul"),
    deskripsi: formData.get("deskripsi"),
    kelas: formData.get("kelas"),
    pertemuan: Number(formData.get("pertemuan")),
    kategori: formData.get("kategori"),
    video_url: formData.get("video_url"),
    file_url: formData.get("file_url"),
    thumbnail_url: formData.get("thumbnail_url"),
  });

  if (!validated.success) {
    return { status: "error", errors: { ...validated.error.flatten().fieldErrors, _form: [] } };
  }

  // handle file upload (replace) — if new File provided, upload and optionally overwrite old path
  if (validated.data.file_url instanceof File) {
    const oldFile = String(formData.get("old_file_url") ?? "");
    const oldPath = oldFile ? oldFile.split("/materi/files/")[1] : undefined;
    const { data, errors } = await uploadFile("files", "materi/files", validated.data.file_url, oldPath);
    if (errors) return { status: "error", errors: { ...prevState.errors, _form: [...(errors._form || [])] } };
    validated = { ...validated, data: { ...validated.data, file_url: data.url } };
  }

  // handle thumbnail upload (replace)
  if (validated.data.thumbnail_url instanceof File) {
    const oldThumb = String(formData.get("old_thumbnail_url") ?? "");
    const oldThumbPath = oldThumb ? oldThumb.split("/materi/thumbnails/")[1] : undefined;
    const { data, errors } = await uploadFile("images", "materi/thumbnails", validated.data.thumbnail_url, oldThumbPath);
    if (errors) return { status: "error", errors: { ...prevState.errors, _form: [...(errors._form || [])] } };
    validated = { ...validated, data: { ...validated.data, thumbnail_url: data.url } };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("materi")
    .update({
      judul: validated.data.judul,
      deskripsi: validated.data.deskripsi ?? null,
      kelas: validated.data.kelas ?? null,
      pertemuan: validated.data.pertemuan ?? null,
      kategori: validated.data.kategori ?? null,
      file_url: validated.data.file_url ?? null,
      video_url: validated.data.video_url ?? null,
      thumbnail_url: validated.data.thumbnail_url ?? null,
    })
    .eq("id", id);

  if (error) return { status: "error", errors: { ...prevState.errors, _form: [error.message] } };

  return { status: "success" };
}

export async function deleteMateri(prevState: PrevState, formData: FormData) {
  const id = formData.get("id") as string;
  const fileUrl = formData.get("file_url") as string;
  const thumbnailUrl = formData.get("thumbnail_url") as string;

  const supabase = await createClient();

  /* ===========================
      DELETE FILE (PDF/DOC)
  ============================ */
  if (fileUrl) {
    try {
      const path = fileUrl.split("/materi/")[1];
      if (path) await deleteFile("files", `materi/${path}`);
    } catch (_) {}
  }

  /* ===========================
      DELETE THUMBNAIL
  ============================ */
  if (thumbnailUrl) {
    try {
      const path = thumbnailUrl.split("/materi/")[1];
      if (path) await deleteFile("images", `materi/${path}`);
    } catch (_) {}
  }

  /* ===========================
      DELETE RECORD DATABASE
  ============================ */
  const { error } = await supabase.from("materi").delete().eq("id", id);

  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [error.message],
      },
    };
  }

  return { status: "success" };
}
