"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUserSchema } from "@/validations/auth-validation";
import { INITIAL_STATE_CREATE_USER } from "@/constants/auth-constant";
import { AuthFormState } from "@/types/auth";

export async function register(prevState: AuthFormState, formData: FormData | null): Promise<AuthFormState> {
  // 1. Guard Clause: Pastikan form data tidak kosong
  if (!formData) return INITIAL_STATE_CREATE_USER;

  // 2. Validasi Input menggunakan Zod
  const validatedFields = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "Siswa",
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: [],
      },
    };
  }

  // Destrukturisasi data agar lebih bersih saat dipanggil
  const { email, password, name, role } = validatedFields.data;
  let isSuccess = false; // Flag untuk menentukan apakah redirect bisa dilakukan

  // 3. Database Interaction dengan Error Handling yang Aman
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    // Tangani error yang dikembalikan oleh Supabase (termasuk Rate Limit)
    if (error) {
      return {
        status: "error",
        errors: {
          ...prevState.errors,
          _form: [error.message],
        },
      };
    }

    // Jika tidak ada error, set flag sukses
    isSuccess = true;
  } catch (err: any) {
    // Tangani system/network error yang tidak terduga
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["Terjadi kesalahan pada server. Silakan coba lagi nanti."],
      },
    };
  }

  // 4. Revalidate & Redirect
  // PENTING: redirect() harus selalu dieksekusi di luar blok try-catch
  if (isSuccess) {
    revalidatePath("/", "layout");
    redirect("/login?registered=1");
  }

  return prevState;
}
