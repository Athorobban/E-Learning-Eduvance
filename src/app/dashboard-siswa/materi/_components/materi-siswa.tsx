"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, PlayCircle, FileText } from "lucide-react";

// Tipe data berdasarkan tabel public.materi (002-materi.sql)
type Materi = {
  id: string;
  judul: string;
  deskripsi: string | null;
  kelas: string | null;
  kategori: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  file_url: string | null;
};

export default function MateriPage() {
  const supabase = createClient();

  const {
    data: materiList,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["materi-siswa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materi").select("id, judul, deskripsi, kelas, kategori, thumbnail_url, video_url, file_url").order("created_at", { ascending: false });

      if (error) throw error;
      return data as Materi[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-400 text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-primary" />
        <p className="font-medium animate-pulse">Menyiapkan materi untukmu...</p>
      </div>
    );
  }

  if (isError) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">Gagal memuat materi. Silakan muat ulang halaman.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <BookOpen className="size-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Eksplorasi Materi</h1>
          <p className="text-slate-500">Pilih materi yang ingin kamu pelajari hari ini.</p>
        </div>
      </div>

      {/* GRID KARTU MATERI */}
      {materiList?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="size-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Belum ada materi yang dibagikan oleh gurumu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materiList?.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard-siswa/materi/detail-materi?id=${m.id}`}
              className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden"
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {m.thumbnail_url ? (
                  <Image src={m.thumbnail_url} alt={m.judul} fill priority className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <BookOpen className="size-8 mb-2 opacity-50" />
                    <span className="text-xs">Tanpa Gambar</span>
                  </div>
                )}

                {/* Badge Kategori & Kelas */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {m.kategori && <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold rounded-md shadow-sm">{m.kategori}</span>}
                  {m.kelas && <span className="px-2 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-md shadow-sm">Kelas {m.kelas}</span>}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{m.judul}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2 flex-1">{m.deskripsi || "Pelajari materi ini lebih lanjut di dalam."}</p>

                {/* Indikator Tipe File */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                  {m.video_url && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                      <PlayCircle className="size-4" /> Video
                    </div>
                  )}
                  {m.file_url && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <FileText className="size-4" /> Dokumen
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
