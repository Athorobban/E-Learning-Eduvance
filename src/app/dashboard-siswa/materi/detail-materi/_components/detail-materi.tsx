"use client";

import { use, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getYoutubeEmbedUrl } from "@/utils/youtube";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Download, FileText, Loader2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DetailMateriPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  // 1. Fetching Data Materi menggunakan React Query
  const {
    data: materi,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["materi-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("materi").select("*").eq("id", id).single();

      if (error) throw error;
      return data;
    },
  });

  // 2. Fungsi Rekam Jejak (Track View) - Berjalan otomatis di background
  useEffect(() => {
    async function trackView() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Catat tampilan (Gunakan 'upsert' atau biarkan gagal diam-diam jika duplikat, sesuai desain DB Anda)
      await supabase.from("materi_views").insert({ materi_id: id, siswa_id: user.id }).select().single();
    }

    // Hanya jalankan pencatatan jika materi sukses dimuat
    if (materi) {
      trackView();
    }
  }, [id, materi, supabase]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-primary" />
        <p className="font-medium animate-pulse">Menyiapkan ruang belajarmu...</p>
      </div>
    );
  }

  if (isError || !materi) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-700">Materi tidak ditemukan.</h2>
        <Link href="/dashboard-siswa/materi" className="text-blue-600 hover:underline mt-2 inline-block">
          Kembali ke daftar materi
        </Link>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(materi.video_url);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* TOMBOL KEMBALI */}
      <Link href="/dashboard-siswa/materi" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="size-4" /> Kembali
      </Link>

      {/* HEADER JUDUL */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            {materi.kategori && <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">{materi.kategori}</span>}
            {materi.kelas && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">Kelas {materi.kelas}</span>}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">{materi.judul}</h1>

          {materi.deskripsi && <p className="mt-4 text-slate-600 text-lg leading-relaxed whitespace-pre-line">{materi.deskripsi}</p>}
        </div>
      </div>

      {/* DUA KOLOM: VIDEO & FILE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: VIDEO PLAYER (Lebih Lebar) */}
        <div className="lg:col-span-2 space-y-6">
          {embedUrl ? (
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                <PlayCircle className="size-5 text-rose-500" />
                Video Pembelajaran
              </h2>
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                <iframe src={embedUrl} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400">
              <PlayCircle className="size-12 mb-2 opacity-50" />
              <p>Tidak ada video untuk materi ini.</p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: DOKUMEN & INFO LAIN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <FileText className="size-5 text-emerald-500" />
              Lampiran Materi
            </h2>

            {materi.file_url ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Dokumen Tersedia</h3>
                    <p className="text-xs text-slate-500 mt-1">Unduh dan pelajari materi ini secara offline.</p>
                  </div>
                </div>

                <Button asChild className="w-full h-12 rounded-xl shadow-sm font-semibold" variant="default">
                  <a href={materi.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4 mr-2" />
                    Unduh Dokumen
                  </a>
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
                <p className="text-sm">Tidak ada file lampiran.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
