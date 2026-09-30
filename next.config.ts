import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Masukkan hostname Supabase Anda persis seperti di pesan error
        hostname: "jkpqbifrotswcmcjzdzm.supabase.co",
        port: "",
        pathname: "/**", // Mengizinkan semua folder gambar di dalam domain tersebut
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
