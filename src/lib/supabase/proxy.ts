import { ENVIRONMENT } from "@/config/environment";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const supabaseProxy = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(ENVIRONMENT.supabaseUrl!, ENVIRONMENT.supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // 1. Cek sesi autentikasi dari Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ==========================================
  // KONDISI 1: USER BELUM LOGIN SAMA SEKALI
  // ==========================================
  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url); // Wajib di-return agar proses berhenti di sini
    }

    if (pathname.startsWith("/admin/user")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login-admin";
      return NextResponse.redirect(url); // Wajib di-return
    }
  }

  // ==========================================
  // KONDISI 2: USER SUDAH LOGIN
  // ==========================================
  if (user) {
    // Ambil data role spesifik dari tabel profiles
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

    const role = profile?.role; // Nilainya antara 'Admin' atau 'User' sesuai DB Anda

    // Jika User biasa mencoba menyusup ke halaman Admin
    if (pathname.startsWith("/admin/user") && role !== "Admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Jika Admin malah nyasar ke halaman dashboard User
    if (pathname.startsWith("/dashboard") && role === "Admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/user";
      return NextResponse.redirect(url);
    }

    // Cegah user yang sudah login untuk mengakses halaman login lagi
    if (pathname === "/login" || pathname === "/login-admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "Admin" ? "/admin/user" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
};
