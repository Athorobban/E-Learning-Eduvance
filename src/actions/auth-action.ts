"use server";

import { createClient } from "@/lib/supabase/server"; // Sesuaikan dengan path helper Supabase SSR Anda
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  const cookiesStore = await cookies();

  // 1. Tangkap role pengguna saat ini dari cookie sebelum sesi dihancurkan
  let userRole = "User"; // Fallback default
  const userProfileCookie = cookiesStore.get("user_profile")?.value;

  if (userProfileCookie) {
    try {
      const profile = JSON.parse(userProfileCookie);
      // Validasi role sesuai dengan skema database Anda ('Admin' atau 'User')
      if (profile.role === "Admin") {
        userRole = "Admin";
      }
    } catch (error) {
      console.error("Gagal melakukan parse pada cookie user_profile saat logout");
    }
  }

  // 2. Hancurkan sesi autentikasi di sisi Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error during Supabase signout:", error.message);
  }

  // 3. Hapus cookie lokal yang menyimpan data profil
  cookiesStore.delete("user_profile");

  // 4. Bersihkan cache router Next.js agar UI ter-update
  revalidatePath("/", "layout");

  // 5. Lakukan redirect dinamis berdasarkan role yang sudah kita amankan di langkah 1
  if (userRole === "Admin") {
    redirect("/login-admin");
  } else {
    redirect("/login");
  }
}
