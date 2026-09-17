"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { AuthFormState } from "@/types/auth";
import { INITIAL_STATE_CREATE_USER, INITIAL_STATE_UPDATE_USER } from "@/constants/auth-constant";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";

// ==========================================
// 1. CREATE USER
// ==========================================
export async function createUser(prevState: AuthFormState, formData: FormData | null): Promise<AuthFormState> {
  try {
    if (!formData) return INITIAL_STATE_CREATE_USER;

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    // Inisialisasi client DI DALAM fungsi.
    // Ini mencegah aplikasi mati total jika .env lupa di-setting.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: "error",
        errors: { _form: ["Kunci SUPABASE_PUBLISHABLE_KEY belum disetting di file .env"] },
      };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    // Jika email sudah ada atau password kurang kuat, kembalikan error ke UI
    if (error) {
      return { status: "error", errors: { _form: [error.message] } };
    }

    revalidatePath("/admin/user", "page");
    return { status: "success", errors: {} };
  } catch (err: any) {
    // Menangkap error jaringan/sistem yang tidak terduga
    return { status: "error", errors: { _form: [err.message || "Terjadi kesalahan internal server"] } };
  }
}

// ==========================================
// 2. UPDATE USER
// ==========================================
export async function updateUser(prevState: AuthFormState, formData: FormData | null): Promise<AuthFormState> {
  try {
    if (!formData) return INITIAL_STATE_UPDATE_USER;

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { error } = await supabaseAdmin.from("profiles").update({ name, role, updated_at: new Date().toISOString() }).eq("id", id);

    if (error) return { status: "error", errors: { _form: [error.message] } };

    revalidatePath("/admin/user", "page");
    return { status: "success", errors: {} };
  } catch (err: any) {
    return { status: "error", errors: { _form: [err.message] } };
  }
}

// ==========================================
// 3. DELETE USER
// ==========================================
export async function deleteUser(prevState: any, formData: FormData | null) {
  try {
    if (!formData) return INITIAL_STATE_ACTION;

    const id = formData.get("id") as string;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) return { status: "error", errors: { _form: [error.message] } };

    revalidatePath("/admin/user", "page");
    return { status: "success", errors: {} };
  } catch (err: any) {
    return { status: "error", errors: { _form: [err.message] } };
  }
}
