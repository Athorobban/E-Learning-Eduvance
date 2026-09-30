"use server";

import { createClient } from "@/lib/supabase/server"; // Pastikan path ini mengarah ke inisialisasi SSR Supabase Anda
import { AuthFormState } from "@/types/auth";
import { createUserSchema } from "@/validations/auth-validation";
import { INITIAL_STATE_CREATE_USER } from "@/constants/auth-constant";
import { redirect } from "next/navigation";

export async function register(prevState: AuthFormState, formData: FormData | null): Promise<AuthFormState> {
  // 1. Guard Clause
  if (!formData) return INITIAL_STATE_CREATE_USER;

  // 2. Validasi Server (Lapis Kedua Keamanan)
  const validatedFields = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: ["Data yang dimasukkan tidak valid."],
      },
    };
  }

  const { email, password, name, role } = validatedFields.data;
  let isSuccess = false;

  // 3. Eksekusi Database
  try {
    const supabase = await createClient();

    // Menggunakan fungsi signUp standar untuk registrasi publik
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // PENTING: Data ini akan dibaca oleh Trigger SQL 'handle_new_user'
        data: {
          name: name,
          role: role,
        },
      },
    });

    if (error) {
      return {
        status: "error",
        errors: { _form: [error.message] }, // Mengirim pesan error Supabase ke UI
      };
    }

    isSuccess = true;
  } catch (err: any) {
    return {
      status: "error",
      errors: { _form: ["Terjadi kesalahan pada server. Silakan coba lagi."] },
    };
  }

  // 4. Redirect hanya dilakukan di luar blok try-catch jika berhasil
  if (isSuccess) {
    redirect("/login?registered=1");
  }

  return prevState;
}
