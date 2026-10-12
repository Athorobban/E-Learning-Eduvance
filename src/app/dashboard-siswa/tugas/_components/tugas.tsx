"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, Clock, CheckCircle2, ChevronRight, AlertCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TugasPage() {
  const supabase = createClient();

  const {
    data: tugasList,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tugas-siswa"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User belum login");

      // 1. Ambil semua tugas dari tabel
      const { data: tugasData, error: tugasError } = await supabase.from("tugas").select("id, judul, deskripsi, deadline, created_at").order("created_at", { ascending: false });

      if (tugasError) throw tugasError;

      // 2. Ambil status pengumpulan khusus untuk siswa yang sedang login
      const { data: pengumpulanData } = await supabase.from("tugas_pengumpulan").select("tugas_id, status, nilai").eq("siswa_id", user.id);

      // 3. Gabungkan datanya agar UI bisa mendeteksi status tiap tugas
      return (tugasData || []).map((tugas) => {
        const submission = pengumpulanData?.find((p) => p.tugas_id === tugas.id);
        return { ...tugas, submission };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-emerald-500" />
        <p className="font-medium animate-pulse">Memuat daftar tugas...</p>
      </div>
    );
  }

  if (isError) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">Gagal memuat daftar tugas. Silakan muat ulang halaman.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
          <ClipboardCheck className="size-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Tugas & Evaluasi</h1>
          <p className="text-slate-500">Kerjakan tugas tepat waktu untuk mendapatkan hasil maksimal.</p>
        </div>
      </div>

      {/* LIST TUGAS */}
      {tugasList?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <ClipboardCheck className="size-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Belum ada tugas yang diberikan oleh gurumu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tugasList?.map((t) => {
            const isSubmitted = t.submission?.status === "submitted";
            const isGraded = t.submission?.status === "graded";

            // Logika Deadline
            const deadlineDate = t.deadline ? new Date(t.deadline) : null;
            const isOverdue = deadlineDate ? deadlineDate < new Date() : false;

            return (
              <Link
                key={t.id}
                href={`/dashboard-siswa/tugas/${t.id}`}
                className={cn(
                  "group flex flex-col bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 hover:shadow-md",
                  isGraded ? "border-emerald-200 hover:border-emerald-400" : isSubmitted ? "border-blue-200 hover:border-blue-400" : "border-slate-100 hover:border-slate-300",
                )}
              >
                {/* Status Badges */}
                <div className="flex justify-between items-start mb-4">
                  {isGraded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">
                      <Award className="size-3.5" /> Dinilai: {t.submission?.nilai ?? 0}/100
                    </span>
                  ) : isSubmitted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold">
                      <CheckCircle2 className="size-3.5" /> Menunggu Nilai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                      <AlertCircle className="size-3.5" /> Belum Dikerjakan
                    </span>
                  )}
                </div>

                {/* Konten */}
                <h3 className="font-bold text-lg text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">{t.judul}</h3>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className={cn("flex items-center gap-1.5 text-xs font-medium", isOverdue && !isSubmitted && !isGraded ? "text-red-500" : "text-slate-500")}>
                    <Clock className="size-4" />
                    {deadlineDate ? deadlineDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Tanpa Batas Waktu"}
                  </div>
                  <ChevronRight className="size-5 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
