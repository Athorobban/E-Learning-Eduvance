import { INITIAL_CREATE_USER_FORM, INITIAL_STATE_CREATE_USER } from "@/constants/auth-constant";
import { CreateUserForm, createUserSchema } from "@/validations/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createUser } from "../actions";
import { toast } from "sonner";
import FormUser from "./form-user";

export default function DialogCreateUser({ refetch }: { refetch: () => void }) {
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: INITIAL_CREATE_USER_FORM,
  });

  const [createUserState, createUserAction, isPendingCreateUser] = useActionState(createUser, INITIAL_STATE_CREATE_USER);

  // Perhatikan perubahan pada handleSubmit di sini
  const onSubmit = form.handleSubmit(
    // 1. Callback jika validasi LOLOS (onValid)
    (data) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      startTransition(() => {
        createUserAction(formData);
      });
    },
    // 2. Callback jika validasi GAGAL (onInvalid) -> Menangkap Silent Error
    (errors) => {
      // Ambil pesan error pertama dari Zod
      const firstError = Object.values(errors)[0]?.message as string;

      toast.error("Validasi Form Gagal", {
        description: firstError || "Mohon periksa kembali inputan Anda.",
      });
    },
  );

  useEffect(() => {
    if (createUserState?.status === "error") {
      toast.error("Gagal Membuat User", {
        description: createUserState.errors?._form?.[0],
      });
    }

    if (createUserState?.status === "success") {
      toast.success("User Berhasil Dibuat");
      form.reset();
      document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      refetch();
    }
  }, [createUserState, form, refetch]);

  return <FormUser form={form} onSubmit={onSubmit} isLoading={isPendingCreateUser} type="Create" />;
}
