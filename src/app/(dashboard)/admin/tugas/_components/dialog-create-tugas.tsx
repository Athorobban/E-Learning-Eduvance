"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TugasForm, tugasFormSchema } from "@/validations/tugas-validation";
import { INITIAL_TUGAS } from "@/constants/tugas-constant";
import { createTugas } from "../actions";
import FormTugas from "./form-tugas";

type DialogCreateTugasProps = {
  refetch: () => void;
  onSuccess?: () => void;
};

export default function DialogCreateTugas({ refetch, onSuccess }: DialogCreateTugasProps) {
  const form = useForm<TugasForm>({
    resolver: zodResolver(tugasFormSchema),
    defaultValues: INITIAL_TUGAS,
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();

    if (data.file_url instanceof File && data.file_url.size > 0) {
      formData.append("file_url", data.file_url);
    }

    formData.append("judul", data.judul);
    formData.append("deskripsi", data.deskripsi || "");

    // Konversi datetime-local ke ISO string agar akurat pada kolom timestamptz
    if (data.deadline) {
      const parsedDate = new Date(data.deadline);
      formData.append("deadline", !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : data.deadline);
    } else {
      formData.append("deadline", "");
    }

    setIsLoading(true);

    startTransition(() => {
      createTugas(formData)
        .then((res) => {
          setIsLoading(false);

          if (res.status === "error") {
            toast.error("Gagal membuat tugas", {
              description: res.errors?._form?.[0] || "Terjadi kesalahan saat menyimpan tugas.",
            });
            return;
          }

          toast.success("Tugas berhasil dibuat");
          form.reset(INITIAL_TUGAS);
          refetch();
          onSuccess?.();
        })
        .catch(() => {
          setIsLoading(false);
          toast.error("Gagal membuat tugas", {
            description: "Terjadi gangguan koneksi ke server.",
          });
        });
    });
  });

  return <FormTugas form={form} onSubmit={onSubmit} isLoading={isLoading} type="Create" />;
}
