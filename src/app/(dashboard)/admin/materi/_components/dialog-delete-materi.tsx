"use client";

import DialogDelete from "@/components/common/dialog-delete";
import { startTransition, useActionState, useEffect } from "react";
import { deleteMateri } from "../actions";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { toast } from "sonner";
import { Materi } from "@/validations/materi-validation";

export default function DialogDeleteMateri({ open, refetch, currentData, handleChangeAction }: { refetch: () => void; currentData?: Materi; open: boolean; handleChangeAction: (open: boolean) => void }) {
  const [deleteMateriState, deleteMateriAction, isPending] = useActionState(deleteMateri, INITIAL_STATE_ACTION);

  const onSubmit = () => {
    const formData = new FormData();

    formData.append("id", currentData?.id ?? "");
    formData.append("file_url", currentData?.file_url ?? "");
    formData.append("thumbnail_url", currentData?.thumbnail_url ?? "");

    startTransition(() => deleteMateriAction(formData));
  };

  useEffect(() => {
    if (deleteMateriState?.status === "error") {
      toast.error("Gagal menghapus materi", {
        description: deleteMateriState.errors?._form?.[0],
      });
    }

    if (deleteMateriState?.status === "success") {
      toast.success("Materi berhasil dihapus");
      handleChangeAction(false);
      refetch();
    }
  }, [deleteMateriState]);

  return <DialogDelete open={open} onOpenChange={handleChangeAction} isLoading={isPending} onSubmit={onSubmit} title="Materi" />;
}
