import DialogDelete from "@/components/common/dialog-delete";
import { Profile } from "@/types/auth";
import { startTransition, useActionState, useEffect } from "react";
import { deleteUser } from "../actions";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import { toast } from "sonner";

export default function DialogDeleteUser({ open, refetch, currentData, handleChangeAction }: { refetch: () => void; currentData?: Profile; open: boolean; handleChangeAction: (open: boolean) => void }) {
  const [deleteUserState, deleteUserAction, isPendingDeleteUser] = useActionState(deleteUser, INITIAL_STATE_ACTION);

  const onSubmit = () => {
    const formData = new FormData();
    formData.append("id", currentData!.id as string);

    startTransition(() => {
      deleteUserAction(formData);
    });
  };

  useEffect(() => {
    if (deleteUserState?.status === "error") {
      toast.error("Gagal Menghapus User", {
        description: deleteUserState.errors?._form?.[0],
      });
    }

    if (deleteUserState?.status === "success") {
      toast.success("User Berhasil Dihapus");
      handleChangeAction(false);
      refetch();
    }
  }, [deleteUserState, handleChangeAction, refetch]);

  return <DialogDelete open={open} onOpenChange={handleChangeAction} isLoading={isPendingDeleteUser} onSubmit={onSubmit} title="User" />;
}
