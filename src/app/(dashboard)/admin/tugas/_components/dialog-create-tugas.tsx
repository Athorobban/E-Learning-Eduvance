import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TugasForm, tugasFormSchema } from "@/validations/tugas-validation";
import { INITIAL_TUGAS } from "@/constants/tugas-constant";
import { createTugas } from "../actions";
import FormTugas from "./form-tugas";

export default function DialogCreateTugas({ refetch }: { refetch: () => void }) {
  const form = useForm<TugasForm>({
    resolver: zodResolver(tugasFormSchema),
    defaultValues: INITIAL_TUGAS,
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();

    // file
    if (data.file_url instanceof File) {
      formData.append("file_url", data.file_url);
    }

    // text fields
    formData.append("judul", data.judul);
    formData.append("deskripsi", data.deskripsi || "");
    formData.append("deadline", data.deadline || "");

    setIsLoading(true);

    startTransition(() => {
      createTugas(formData).then((res) => {
        setIsLoading(false);

        if (res.status === "error") {
          toast.error("Gagal membuat tugas", {
            description: res.errors?._form?.[0],
          });
          return;
        }

        toast.success("Tugas berhasil dibuat");
        form.reset();
        refetch();

        document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      });
    });
  });

  return <FormTugas form={form} onSubmit={onSubmit} isLoading={isLoading} type="Create" />;
}
