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
    // 🔒 ATURAN BARU: Cegah akses tamu ke dashboard siswa
    if (pathname.startsWith("/dashboard-siswa")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin/user")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login-admin";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ==========================================
  // KONDISI 2: USER SUDAH LOGIN
  // ==========================================
  if (user) {
    // Ambil data role spesifik dari tabel profiles
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

    const role = profile?.role; // 'Admin', 'Guru', atau 'Siswa'

    // 🔒 ATURAN BARU: Hanya "Siswa" yang boleh masuk ke /dashboard-siswa
    if (pathname.startsWith("/dashboard-siswa") && role !== "Siswa") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 🔒 Mencegah "Siswa" menyusup ke halaman /admin
    if (pathname.startsWith("/admin") && role === "Siswa") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard-siswa";
      return NextResponse.redirect(url);
    }

    // Logika hierarki spesifik untuk Admin vs Guru
    if (pathname.startsWith("/admin/user") && role !== "Admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    // Cegah user yang sudah login untuk mengakses halaman login/register lagi
    if (pathname === "/login" || pathname === "/login-admin" || pathname === "/register") {
      const url = request.nextUrl.clone();

      // Arahkan ke rute yang tepat sesuai role
      if (role === "Siswa") {
        url.pathname = "/dashboard-siswa";
      } else if (role === "Admin") {
        url.pathname = "/admin/user";
      } else {
        url.pathname = "/admin"; // Guru
      }

      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
};
