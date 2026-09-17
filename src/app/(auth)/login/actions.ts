"use server";

import { INITIAL_STATE_LOGIN_FORM } from "@/constants/auth-constant";
import { createClient } from "@/lib/supabase/server";
import { AuthFormState } from "@/types/auth";
import { loginSchemaForm } from "@/validations/auth-validation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const REDIRECT_ROUTES = {
  ADMIN: "/admin",
  SISWA: "/dashboard-siswa",
  DEFAULT: "/", // Pastikan rute ini bukan halaman login agar tidak terjadi infinite loop
} as const;

export async function login(prevState: AuthFormState, formData: FormData | null): Promise<AuthFormState> {
  // 1. Guard Clause: Kembalikan state awal jika tidak ada form data
  if (!formData) return INITIAL_STATE_LOGIN_FORM;

  // 2. Validasi input
  const validatedFields = loginSchemaForm.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
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

  let destination: string = REDIRECT_ROUTES.DEFAULT;
  let isSuccess = false; // Flag khusus agar redirect aman dari try...catch

  // 3. Interaksi Database dengan Error Handling
  try {
    const supabase = await createClient();

    // Autentikasi User
    const {
      error,
      data: { user },
    } = await supabase.auth.signInWithPassword(validatedFields.data);

    // Jika Supabase menolak login (password salah, email belum diverifikasi, dll)
    if (error) {
      return {
        status: "error",
        errors: {
          ...prevState.errors,
          _form: [error.message], // Pesan ini akan dikembalikan ke UI Form Anda
        },
      };
    }

    // Ambil Profil User
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user?.id).single();

    if (!profileError && profile) {
      // Set Session Cookie
      const cookiesStore = await cookies();
      cookiesStore.set("user_profile", JSON.stringify(profile), {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 Tahun
      });

      // Tentukan Tujuan Redirect berdasarkan Role
      const role = profile.role;
      if (role === "Admin" || role === "Guru") {
        destination = REDIRECT_ROUTES.ADMIN;
      } else if (role === "Siswa") {
        destination = REDIRECT_ROUTES.SISWA;
      }
    }

    // Tandai proses berhasil sepenuhnya
    isSuccess = true;
  } catch (err: any) {
    // Menangkap error jaringan/server yang tidak terduga
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["Terjadi kesalahan sistem saat menghubungi server."],
      },
    };
  }

  // 4. Eksekusi Redirect di luar try...catch
  // (Wajib di Next.js karena redirect() akan melempar error bawaan sistem)
  if (isSuccess) {
    revalidatePath("/", "layout");
    redirect(destination);
  }

  return prevState;
}
