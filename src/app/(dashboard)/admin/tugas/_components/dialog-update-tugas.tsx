import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { tugasFormSchema, TugasForm } from "@/validations/tugas-validation";
import { updateTugas } from "../actions";
import FormTugas from "./form-tugas";
import { Dialog } from "@/components/ui/dialog";
import { Preview } from "@/types/general";

export default function DialogUpdateTugas({ refetch, currentData, open, handleChangeAction }: { refetch: () => void; currentData?: any; open?: boolean; handleChangeAction?: (open: boolean) => void }) {
  const form = useForm<TugasForm>({
    resolver: zodResolver(tugasFormSchema),
  });

  const [isLoading, setIsLoading] = useState(false);

  const [preview, setPreview] = useState<Preview | undefined>(undefined);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();

    // FILE
    if (data.file_url instanceof File) {
      formData.append("file_url", data.file_url);
      formData.append("old_file_url", currentData?.file_url ?? "");
    } else {
      formData.append("file_url", currentData?.file_url ?? "");
      formData.append("old_file_url", currentData?.file_url ?? "");
    }

    // OTHER FIELDS
    formData.append("judul", data.judul);
    formData.append("deskripsi", data.deskripsi || "");
    formData.append("deadline", data.deadline || "");

    // required ID
    formData.append("id", currentData?.id);

    setIsLoading(true);

    startTransition(() => {
      updateTugas(formData).then((res) => {
        setIsLoading(false);

        if (res.status === "error") {
          toast.error("Gagal mengupdate tugas", {
            description: res.errors?._form?.[0],
          });
          return;
        }

        toast.success("Tugas berhasil diupdate");
        form.reset();
        handleChangeAction?.(false);
        refetch();
      });
    });
  });

  // SET DEFAULT VALUE KE FORM
  useEffect(() => {
    if (!currentData) return;

    form.setValue("judul", currentData.judul);
    form.setValue("deskripsi", currentData.deskripsi ?? "");
    form.setValue("deadline", currentData.deadline ?? "");
    form.setValue("file_url", currentData.file_url ?? "");

    // preview untuk file
    if (currentData.file_url) {
      setPreview({
        displayUrl: currentData.file_url,
        file: undefined as unknown as File,
      });
    }
  }, [currentData]);

  return (
    <Dialog open={open} onOpenChange={handleChangeAction}>
      <FormTugas form={form} onSubmit={onSubmit} isLoading={isLoading} type="Update" />
    </Dialog>
  );
}
