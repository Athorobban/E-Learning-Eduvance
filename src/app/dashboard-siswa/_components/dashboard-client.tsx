"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CardMenu from "./CardMenu";
import CardProgress from "./CardProgress";
import { useAuthStore } from "@/stores/auth-store";
import { Sparkles, Rocket, Target, BookOpen, Trophy } from "lucide-react";

export default function DashboardClient() {
  const supabase = createClient();

  // Mengambil nama dari global store agar sapaan lebih personal
  const profile = useAuthStore((state) => state.profile);
  const studentName = profile?.name || "Siswa Hebat";

  const [totalMateri, setTotalMateri] = useState(0);
  const [doneMateri, setDoneMateri] = useState(0);

  const [totalTugas, setTotalTugas] = useState(0);
  const [doneTugas, setDoneTugas] = useState(0);

  const [totalKuis, setTotalKuis] = useState(0);
  const [doneKuis, setDoneKuis] = useState(0);

  useEffect(() => {
    async function fetchProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ count: tMateri }, { count: dMateri }, { count: tTugas }, { count: dTugas }, { count: tKuis }, { count: dKuis }] = await Promise.all([
        supabase.from("materi").select("*", { count: "exact", head: true }),
        supabase.from("materi_views").select("*", { count: "exact", head: true }).eq("siswa_id", user.id),
        supabase.from("tugas").select("*", { count: "exact", head: true }),
        supabase.from("tugas_pengumpulan").select("*", { count: "exact", head: true }).eq("siswa_id", user.id),
        supabase.from("quizzes").select("*", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("student_id", user.id),
      ]);

      setTotalMateri(tMateri || 0);
      setDoneMateri(dMateri || 0);

      setTotalTugas(tTugas || 0);
      setDoneTugas(dTugas || 0);

      setTotalKuis(tKuis || 0);
      setDoneKuis(dKuis || 0);
    }

    fetchProgress();
  }, [supabase]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. HERO BANNER & MOTIVASI */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 border border-white/10">
        {/* Konten Utama Banner */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-semibold tracking-wide">
            <Sparkles className="size-4 text-yellow-300" />
            <span>Semangat Belajar!</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">Halo, {studentName}! 👋</h1>

          <p className="text-blue-100/90 text-base md:text-lg mb-0 leading-relaxed max-w-xl">
            Selamat datang di kelas digitalmu. Setiap materi yang kamu selesaikan hari ini adalah satu langkah besar menuju cita-citamu. Yuk, mulai petualangan belajarmu sekarang!
          </p>
        </div>

        {/* Ornamen / Dekorasi Background (Tidak perlu import gambar) */}
        <Rocket className="absolute -bottom-8 -right-8 size-64 md:size-80 text-white opacity-10 rotate-12 transition-transform duration-1000 hover:-translate-y-4 hover:translate-x-4" />
        <div className="absolute top-10 right-20 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30" />
      </div>

      {/* 2. MENU CEPAT */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Target className="size-6 text-blue-600" />
          Fokus Hari Ini
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <CardMenu title="Materi Belajar" href="/dashboard-siswa/materi" color="bg-blue-600" />
          <CardMenu title="Kumpulan Tugas" href="/dashboard-siswa/tugas" color="bg-emerald-600" />
          <CardMenu title="Kuis & Ujian" href="/dashboard-siswa/kuis" color="bg-purple-600" />
        </div>
      </div>

      {/* 3. PROGRES BELAJAR */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="size-6 text-amber-500" />
          Pencapaianmu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <CardProgress label="Progres Materi" done={doneMateri} total={totalMateri} color="bg-blue-600" />
          <CardProgress label="Progres Tugas" done={doneTugas} total={totalTugas} color="bg-emerald-600" />
          <CardProgress label="Progres Kuis" done={doneKuis} total={totalKuis} color="bg-purple-600" />
        </div>
      </div>
    </div>
  );
}
