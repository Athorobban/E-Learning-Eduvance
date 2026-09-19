"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, ClipboardCheck, GraduationCap, Trophy, Loader2, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function ProgresPage() {
  const supabase = createClient();
  const profile = useAuthStore((state) => state.profile);

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    materi: { done: 0, total: 0 },
    tugas: { done: 0, total: 0 },
    kuis: { done: 0, total: 0 },
  });

  useEffect(() => {
    async function fetchDetailedProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetching secara paralel untuk performa super cepat
      const [{ count: tMateri }, { count: dMateri }, { count: tTugas }, { count: dTugas }, { count: tKuis }, { count: dKuis }] = await Promise.all([
        supabase.from("materi").select("*", { count: "exact", head: true }),
        supabase.from("materi_views").select("*", { count: "exact", head: true }).eq("siswa_id", user.id),

        supabase.from("tugas").select("*", { count: "exact", head: true }),
        supabase.from("tugas_pengumpulan").select("*", { count: "exact", head: true }).eq("siswa_id", user.id),

        supabase.from("quizzes").select("*", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("student_id", user.id),
      ]);

      setStats({
        materi: { done: dMateri || 0, total: tMateri || 0 },
        tugas: { done: dTugas || 0, total: tTugas || 0 },
        kuis: { done: dKuis || 0, total: tKuis || 0 },
      });

      setIsLoading(false);
    }

    fetchDetailedProgress();
  }, [supabase]);

  // Kalkulasi persentase keseluruhan
  const totalItems = stats.materi.total + stats.tugas.total + stats.kuis.total;
  const totalDone = stats.materi.done + stats.tugas.done + stats.kuis.done;
  const overallPercentage = totalItems === 0 ? 0 : Math.round((totalDone / totalItems) * 100);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-400px text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-blue-500" />
        <p className="font-medium animate-pulse">Menghitung progres belajarmu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. HEADER & OVERALL PROGRESS */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-x-1/3 -translate-y-1/3" />

        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">Rapor Progres Belajar</h1>
          <p className="text-slate-500 max-w-md">Lacak perjalanan belajarmu di sini. Selesaikan semua materi dan tugas untuk mendapatkan hasil maksimal!</p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-slate-50 py-4 px-6 rounded-2xl border border-slate-100">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Trophy className="size-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Penyelesaian</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800">{overallPercentage}</span>
              <span className="text-xl font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DETAIL PROGRESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard title="Materi Dibaca" done={stats.materi.done} total={stats.materi.total} icon={BookOpen} color="blue" />
        <ProgressCard title="Tugas Diselesaikan" done={stats.tugas.done} total={stats.tugas.total} icon={ClipboardCheck} color="emerald" />
        <ProgressCard title="Kuis Dikerjakan" done={stats.kuis.done} total={stats.kuis.total} icon={GraduationCap} color="purple" />
      </div>

      {/* 3. MOTIVASI BERRDASARKAN PROGRES */}
      <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm shrink-0">
          <TrendingUp className="size-6 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">{overallPercentage === 100 ? "Luar Biasa, Sempurna! 🎉" : overallPercentage >= 50 ? "Hebat, Kamu Sudah Setengah Jalan! 🚀" : "Ayo Mulai Petualanganmu! 💪"}</h3>
          <p className="text-slate-300 text-sm">
            {overallPercentage === 100 ? "Kamu telah menyelesaikan seluruh aktivitas di platform ini. Pertahankan prestasimu!" : `Kamu memiliki ${totalItems - totalDone} aktivitas yang belum diselesaikan. Yuk, kerjakan sekarang!`}
          </p>
        </div>
      </div>
    </div>
  );
}

// === KOMPONEN KARTU PROGRES REUSABLE ===
function ProgressCard({ title, done, total, icon: Icon, color }: any) {
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

  // Konfigurasi warna Tailwind dinamis
  const colorStyles: Record<string, any> = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", bar: "bg-purple-500" },
  };

  const style = colorStyles[color];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl ${style.bg} ${style.text}`}>
          <Icon className="size-6" />
        </div>
        <span className={`text-2xl font-extrabold ${style.text}`}>{percentage}%</span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm font-medium text-slate-500 mb-4">
        {done} dari {total} aktivitas selesai
      </p>

      {/* Custom Progress Bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
