import DialogDelete from "@/components/common/dialog-delete";
import { startTransition, useActionState, useEffect } from "react";
import { deleteTugas } from "../actions";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { toast } from "sonner";

export default function DialogDeleteTugas({ open, refetch, currentData, handleChangeAction }: { refetch: () => void; currentData?: any; open: boolean; handleChangeAction: (open: boolean) => void }) {
  const [deleteTugasState, deleteTugasAction, isPending] = useActionState(deleteTugas, INITIAL_STATE_ACTION);

  const onSubmit = () => {
    const formData = new FormData();
    formData.append("id", currentData?.id);
    formData.append("file_url", currentData?.file_url ?? "");
    startTransition(() => {
      deleteTugasAction(formData);
    });
  };

  useEffect(() => {
    if (deleteTugasState?.status === "error") {
      toast.error("Gagal menghapus tugas", {
        description: deleteTugasState.errors?._form?.[0],
      });
    }

    if (deleteTugasState?.status === "success") {
      toast.success("Tugas berhasil dihapus");
      handleChangeAction(false);
      refetch();
    }
  }, [deleteTugasState]);

  return <DialogDelete open={open} onOpenChange={handleChangeAction} isLoading={isPending} onSubmit={onSubmit} title="Tugas" />;
}
