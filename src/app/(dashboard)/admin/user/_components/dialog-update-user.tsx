import { INITIAL_STATE_UPDATE_USER } from "@/constants/auth-constant";
import { UpdateUserForm, updateUserSchema } from "@/validations/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateUser } from "../actions";
import { toast } from "sonner";
import FormUser from "./form-user";
import { Profile } from "@/types/auth";
import { Dialog } from "@radix-ui/react-dialog";

export default function DialogUpdateUser({ refetch, currentData, open, handleChangeAction }: { refetch: () => void; currentData?: Profile; open?: boolean; handleChangeAction?: (open: boolean) => void }) {
  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  const [updateUserState, updateUserAction, isPendingUpdateUser] = useActionState(updateUser, INITIAL_STATE_UPDATE_USER);

  // State preview dihapus karena sudah tidak ada upload avatar

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();

    // Looping data langsung tanpa perlu mengecek old_avatar_url
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    formData.append("id", currentData?.id ?? "");

    startTransition(() => {
      updateUserAction(formData);
    });
  });

  useEffect(() => {
    if (updateUserState?.status === "error") {
      toast.error("Update User Failed", {
        description: updateUserState.errors?._form?.[0],
      });
    }

    if (updateUserState?.status === "success") {
      toast.success("Update User Success");
      form.reset();
      handleChangeAction?.(false);
      refetch();
    }
  }, [updateUserState]);

  useEffect(() => {
    if (currentData) {
      form.setValue("name", currentData.name as string);
      form.setValue("role", currentData.role as string);
    }
  }, [currentData]);

  return (
    <Dialog open={open} onOpenChange={handleChangeAction}>
      {/* Prop preview dan setPreview tidak perlu lagi dikirim ke FormUser */}
      <FormUser form={form} onSubmit={onSubmit} isLoading={isPendingUpdateUser} type="Update" />
    </Dialog>
  );
}
