import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createMateri } from "../actions";
import { toast } from "sonner";
import { Preview } from "@/types/general";
import { MateriForm, materiFormSchema } from "@/validations/materi-validation";
import { INITIAL_MATERI, INITIAL_STATE_MATERI } from "@/constants/materi-constant";
import FormMateri from "./form-materi";

export default function DialogCreateMateri({ refetch }: { refetch: () => void }) {
  const form = useForm<MateriForm>({
    resolver: zodResolver(materiFormSchema),
    defaultValues: INITIAL_MATERI,
  });

  const [createMateriState, createMateriAction, isPendingCreateMateri] = useActionState(createMateri, INITIAL_STATE_MATERI);

  const [preview, setPreview] = useState<Preview | undefined>(undefined);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();

    // ambil langsung value dari form (bukan hanya preview)
    const fileField = (data as any).file_url;
    const thumbField = (data as any).thumbnail_url;

    // file dokumen: prioritas ke fileField (File), lalu previewFile, lalu kosong
    if (fileField instanceof File) {
      formData.append("file_url", fileField);
    } else if (preview?.file instanceof File) {
      formData.append("file_url", preview.file);
    } else if (typeof fileField === "string" && fileField.length) {
      formData.append("file_url", fileField);
    } else {
      formData.append("file_url", "");
    }

    // thumbnail: prioritas ke thumbnail field (File), lalu previewThumbnail
    if (thumbField instanceof File) {
      formData.append("thumbnail_url", thumbField);
    } else if (preview?.file instanceof File) {
      formData.append("thumbnail_url", preview.file);
    } else if (typeof thumbField === "string" && thumbField.length) {
      formData.append("thumbnail_url", thumbField);
    } else {
      formData.append("thumbnail_url", "");
    }

    // append fields lain (kecuali file fields)
    const skip = new Set(["file_url", "thumbnail_url"]);
    Object.entries(data).forEach(([k, v]) => {
      if (skip.has(k)) return;
      formData.append(k, String(v ?? ""));
    });

    startTransition(() => {
      createMateriAction(formData);
    });
  });

  useEffect(() => {
    if (createMateriState?.status === "error") {
      toast.error("Create Menu Failed", {
        description: createMateriState.errors?._form?.[0],
      });
    }

    if (createMateriState?.status === "success") {
      toast.success("Create Menu Success");
      form.reset();
      setPreview(undefined);
      document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      refetch();
    }
  }, [createMateriState]);

  return <FormMateri form={form} onSubmit={onSubmit} isLoading={isPendingCreateMateri} type="Create" preview={preview} setPreview={setPreview} />;
}
