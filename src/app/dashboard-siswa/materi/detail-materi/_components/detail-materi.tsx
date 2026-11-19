"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getYoutubeEmbedUrl } from "@/utils/youtube";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Calendar, Clock, Download, FileText, Layers, Loader2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  initialMateriId?: string;
};

interface MateriOption {
  id: string;
  judul: string;
  pertemuan: number | null;
}

interface MateriDetail {
  id: string;
  judul: string;
  deskripsi: string | null;
  kelas: string | null;
  pertemuan: number | null;
  kategori: string | null;
  file_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  guru_id: string | null;
  created_at: string;
  updated_at: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DetailMateriPage({ initialMateriId }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [selectedMateriId, setSelectedMateriId] = useState<string>(initialMateriId ?? "");

  useEffect(() => {
    if (initialMateriId) {
      setSelectedMateriId(initialMateriId);
    }
  }, [initialMateriId]);

  // 1. Ambil daftar materi untuk navigasi cepat & fallback jika dibuka tanpa ?id=
  const { data: materiOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["materi-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materi").select("id, judul, pertemuan").order("pertemuan", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as MateriOption[];
    },
  });

  // Otomatis pilih materi pertama jika halaman dibuka tanpa ?id=
  useEffect(() => {
    if (!selectedMateriId && materiOptions && materiOptions.length > 0) {
      const defaultId = materiOptions[0].id;
      setSelectedMateriId(defaultId);
      router.replace(`/dashboard-siswa/materi/detail-materi?id=${defaultId}`);
    }
  }, [selectedMateriId, materiOptions, router]);

  // 2. Fetching detail materi terpilih menggunakan React Query
  const {
    data: materi,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["materi-detail", selectedMateriId],
    enabled: Boolean(selectedMateriId),
    queryFn: async () => {
      const { data, error } = await supabase.from("materi").select("*").eq("id", selectedMateriId).single();

      if (error) {
        console.error("Gagal memuat materi:", error.message);
        throw error;
      }

      return data as MateriDetail;
    },
  });

  // 3. Rekam jejak baca siswa ke tabel materi_views secara aman di background
  useEffect(() => {
    async function trackView() {
      if (!selectedMateriId || !materi) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        const { error } = await supabase.from("materi_views").insert({ materi_id: selectedMateriId, siswa_id: user.id });

        if (error) throw error;
      } catch (err) {
        console.warn("Track view gagal dicatat:", err);
      }
    }

    trackView();
  }, [selectedMateriId, materi, supabase]);

  const handleSelectMateri = (newId: string) => {
    setSelectedMateriId(newId);
    router.replace(`/dashboard-siswa/materi/detail-materi?id=${newId}`);
  };

  if (isLoadingOptions || (Boolean(selectedMateriId) && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-blue-600" />
        <p className="font-medium animate-pulse">Menyiapkan ruang belajarmu...</p>
      </div>
    );
  }

  if (!isLoadingOptions && (!materiOptions || materiOptions.length === 0)) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto mt-10">
        <div className="bg-slate-100 size-16 flex items-center justify-center rounded-full mx-auto mb-4">
          <BookOpen className="size-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Belum Ada Materi</h2>
        <p className="text-slate-500 mt-2 mb-6 text-sm">Guru belum mengunggah materi pembelajaran.</p>
        <Link href="/dashboard-siswa/materi" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium inline-block">
          Kembali ke Daftar Materi
        </Link>
      </div>
    );
  }

  if (isError || !materi) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto mt-10">
        <div className="bg-slate-100 size-16 flex items-center justify-center rounded-full mx-auto mb-4">
          <BookOpen className="size-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Materi tidak ditemukan</h2>
        <p className="text-slate-500 mt-2 mb-6 text-sm">Materi mungkin telah dihapus atau akses ditolak.</p>
        <Link href="/dashboard-siswa/materi" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium inline-block">
          Kembali ke Daftar Materi
        </Link>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(materi.video_url);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* BAR NAVIGASI & PILIH MATERI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/dashboard-siswa/materi" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit">
          <ArrowLeft className="size-4" /> Kembali
        </Link>

        {materiOptions && materiOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="select-materi" className="text-xs font-semibold text-slate-500 shrink-0">
              Pilih Materi:
            </label>
            <select
              id="select-materi"
              value={selectedMateriId}
              onChange={(e) => handleSelectMateri(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-xs"
            >
              {materiOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.pertemuan ? `Pertemuan ${item.pertemuan} - ${item.judul}` : item.judul}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* GAMBAR BANNER / THUMBNAIL */}
      {materi.thumbnail_url && (
        <div className="w-full h-48 md:h-72 relative rounded-3xl overflow-hidden shadow-sm border border-slate-100 bg-slate-900 group">
          <img src={materi.thumbnail_url} alt={materi.judul} loading="eager" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        </div>
      )}

      {/* HEADER INFORMASI MATERI */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          {/* BADGES: Kategori, Kelas, Pertemuan */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-5">
            {materi.kategori && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                <Layers className="size-3.5" /> {materi.kategori}
              </span>
            )}
            {materi.kelas && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                <BookOpen className="size-3.5" /> Kelas {materi.kelas}
              </span>
            )}
            {materi.pertemuan && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                <Calendar className="size-3.5" /> Pertemuan {materi.pertemuan}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-4">{materi.judul}</h1>

          {/* TIMESTAMPS: Dibuat & Diperbarui */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 border-b border-slate-100 pb-5 mb-5">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-slate-400" />
              Diterbitkan: {formatDate(materi.created_at)}
            </span>
            {materi.updated_at !== materi.created_at && (
              <span className="flex items-center gap-1.5 pl-4 border-l border-slate-200">
                <Clock className="size-4 text-blue-400" />
                Diperbarui: {formatDate(materi.updated_at)}
              </span>
            )}
          </div>

          {/* DESKRIPSI MATERI */}
          {materi.deskripsi ? <div className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-line">{materi.deskripsi}</div> : <p className="text-slate-400 italic text-sm">Tidak ada deskripsi untuk materi ini.</p>}
        </div>
      </div>

      {/* DUA KOLOM: VIDEO & FILE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: VIDEO PLAYER */}
        <div className="lg:col-span-2 space-y-6">
          {embedUrl ? (
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                <PlayCircle className="size-6 text-rose-500" />
                Video Pembelajaran
              </h2>
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
                <iframe src={embedUrl} title={materi.judul} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-slate-400">
              <PlayCircle className="size-14 mb-3 opacity-30" />
              <p className="font-medium">Video pembelajaran tidak disematkan.</p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: DOKUMEN & LAMPIRAN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
              <FileText className="size-6 text-emerald-500" />
              Lampiran Dokumen
            </h2>

            {materi.file_url ? (
              <div className="flex flex-col gap-5">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Modul Tersedia</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Unduh file ini untuk dipelajari secara offline di perangkatmu.</p>
                  </div>
                </div>

                <Button asChild className="w-full h-12 rounded-xl shadow-md font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                  <a href={materi.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="size-5 mr-2" />
                    Unduh Dokumen Sekarang
                  </a>
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
                <FileText className="size-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Tidak ada file lampiran.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
