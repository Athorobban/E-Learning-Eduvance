import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { materiSchema, MateriForm, materiFormSchema } from "@/validations/materi-validation";
import { INITIAL_STATE_MATERI } from "@/constants/materi-constant";
import { updateMateri } from "../actions";
import FormMateri from "./form-materi";
import { Dialog } from "@radix-ui/react-dialog";
import { Preview } from "@/types/general";

export default function DialogUpdateMateri({ refetch, currentData, open, handleChangeAction }: { refetch: () => void; currentData?: any; open?: boolean; handleChangeAction?: (open: boolean) => void }) {
  const form = useForm<MateriForm>({
    resolver: zodResolver(materiFormSchema),
  });

  const [updateMateriState, updateMateriAction, isPending] = useActionState(updateMateri, INITIAL_STATE_MATERI);

  // hanya thumbnail preview yg didukung oleh FormMateri
  const [preview, setPreview] = useState<Preview | undefined>(undefined);

  const onSubmit = form.handleSubmit((data: any) => {
    const formData = new FormData();

    // === FILE MATERI (PDF/DOC) ===
    const fileValue = data.file_url;
    if (fileValue instanceof File) {
      formData.append("file_url", fileValue);
      formData.append("old_file_url", currentData?.file_url ?? "");
    } else {
      formData.append("file_url", currentData?.file_url ?? "");
    }

    // === THUMBNAIL ===
    if (preview?.file instanceof File) {
      formData.append("thumbnail_url", preview.file);
      formData.append("old_thumbnail_url", currentData?.thumbnail_url ?? "");
    } else {
      formData.append("thumbnail_url", currentData.thumbnail_url ?? "");
    }

    // === APPEND FIELD LAINNYA ===
    Object.entries(data).forEach(([key, value]) => {
      if (["file_url", "thumbnail_url"].includes(key)) return;
      formData.append(key, String(value ?? ""));
    });

    // required id
    formData.append("id", currentData?.id ?? "");

    startTransition(() => updateMateriAction(formData));
  });

  // handle response
  useEffect(() => {
    if (updateMateriState?.status === "error") {
      toast.error("Gagal mengupdate materi", {
        description: updateMateriState.errors?._form?.[0],
      });
    }

    if (updateMateriState?.status === "success") {
      toast.success("Berhasil mengupdate materi");
      form.reset();
      handleChangeAction?.(false);
      refetch();
    }
  }, [updateMateriState]);

  // DEFAULT VALUE SETTER
  useEffect(() => {
    if (!currentData) return;

    form.setValue("judul", currentData.judul);
    form.setValue("deskripsi", currentData.deskripsi ?? "");
    form.setValue("kategori", currentData.kategori);
    form.setValue("kelas", currentData.kelas);
    form.setValue("pertemuan", currentData.pertemuan ?? "");
    form.setValue("video_url", currentData.video_url ?? "");
    form.setValue("file_url", currentData.file_url ?? "");
    form.setValue("thumbnail_url", currentData.thumbnail_url ?? "");

    // set preview thumbnail, tidak membuat File kosong
    if (currentData.thumbnail_url) {
      setPreview({
        file: undefined as unknown as File,
        displayUrl: currentData.thumbnail_url,
      });
    }
  }, [currentData]);

  return (
    <Dialog open={open} onOpenChange={handleChangeAction}>
      <FormMateri form={form} onSubmit={onSubmit} isLoading={isPending} type="Update" preview={preview} setPreview={setPreview} />
    </Dialog>
  );
}
