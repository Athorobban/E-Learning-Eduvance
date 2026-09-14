"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CardMenu from "./_components/CardMenu";
import CardProgress from "./_components/CardProgress";

export default function DashboardSiswaPage() {
  const supabase = createClient();

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

      /* =========================
         MATERI
      ========================= */
      const { count: totalMateri } = await supabase.from("materi").select("*", { count: "exact", head: true });

      const { count: doneMateri } = await supabase.from("materi_views").select("*", { count: "exact", head: true }).eq("siswa_id", user.id);

      /* =========================
         TUGAS
      ========================= */
      const { count: totalTugas } = await supabase.from("tugas").select("*", { count: "exact", head: true });

      const { count: doneTugas } = await supabase.from("tugas_pengumpulan").select("*", { count: "exact", head: true }).eq("siswa_id", user.id);

      /* =========================
         KUIS
      ========================= */
      const { count: totalKuis } = await supabase.from("quizzes").select("*", { count: "exact", head: true });

      const { count: doneKuis } = await supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("student_id", user.id);

      setTotalMateri(totalMateri || 0);
      setDoneMateri(doneMateri || 0);

      setTotalTugas(totalTugas || 0);
      setDoneTugas(doneTugas || 0);

      setTotalKuis(totalKuis || 0);
      setDoneKuis(doneKuis || 0);
    }

    fetchProgress();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* MENU */}
      <CardMenu title="Materi" href="/dashboard-siswa/materi" color="bg-blue-600" />
      <CardMenu title="Tugas" href="/dashboard-siswa/tugas" color="bg-green-600" />
      <CardMenu title="Kuis" href="/dashboard-siswa/kuis" color="bg-purple-600" />

      {/* PROGRES */}
      <div className="md:col-span-3 grid md:grid-cols-3 gap-4">
        <CardProgress label="Progres Materi" done={doneMateri} total={totalMateri} color="bg-blue-600" />

        <CardProgress label="Progres Tugas" done={doneTugas} total={totalTugas} color="bg-green-600" />

        <CardProgress label="Progres Kuis" done={doneKuis} total={totalKuis} color="bg-purple-600" />
      </div>
    </div>
  );
}
