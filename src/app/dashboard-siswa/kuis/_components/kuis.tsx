"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Loader2, PlayCircle, CheckCircle2, ChevronRight, AlertCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KuisPage() {
  const supabase = createClient();

  const {
    data: kuisList,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["kuis-siswa"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User belum login");

      // 1. Ambil semua kuis
      const { data: kuisData, error: kuisError } = await supabase.from("quizzes").select("id, title, description, created_at").order("created_at", { ascending: false });

      if (kuisError) throw kuisError;

      // 2. Ambil data attempts (percobaan) kuis untuk siswa ini
      const { data: attemptsData } = await supabase.from("quiz_attempts").select("quiz_id, score, completed_at").eq("student_id", user.id);

      // 3. Gabungkan data
      return (kuisData || []).map((kuis) => {
        const attempt = attemptsData?.find((a) => a.quiz_id === kuis.id);
        return { ...kuis, attempt };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-purple-500" />
        <p className="font-medium animate-pulse">Memuat daftar kuis...</p>
      </div>
    );
  }

  if (isError) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">Gagal memuat daftar kuis. Silakan muat ulang halaman.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <GraduationCap className="size-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Kuis & Ujian</h1>
          <p className="text-slate-500">Uji pemahamanmu dengan menyelesaikan kuis yang tersedia.</p>
        </div>
      </div>

      {/* LIST KUIS */}
      {kuisList?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <GraduationCap className="size-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Belum ada kuis yang diterbitkan oleh gurumu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kuisList?.map((q) => {
            const isCompleted = !!q.attempt?.completed_at;

            return (
              <Link
                key={q.id}
                href={`/dashboard-siswa/kuis/${q.id}`}
                className={cn(
                  "group flex flex-col bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 hover:shadow-md",
                  isCompleted ? "border-purple-200 hover:border-purple-400" : "border-slate-100 hover:border-slate-300",
                )}
              >
                {/* Status Badges */}
                <div className="flex justify-between items-start mb-4">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-bold">
                      <Award className="size-3.5" /> Nilai: {q.attempt?.score ?? 0}/100
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                      <AlertCircle className="size-3.5" /> Belum Dikerjakan
                    </span>
                  )}
                </div>

                {/* Konten */}
                <h3 className="font-bold text-lg text-slate-800 line-clamp-2 group-hover:text-purple-600 transition-colors">{q.title}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2 flex-1">{q.description || "Klik untuk melihat detail kuis."}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CheckCircle2 className="size-4" />
                    {isCompleted ? "Selesai" : "Siap Dikerjakan"}
                  </div>
                  <ChevronRight className={cn("size-5 transition-transform group-hover:translate-x-1", isCompleted ? "text-purple-500" : "text-slate-400 group-hover:text-slate-600")} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
