"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProgresPage() {
  const supabase = createClient();
  const [materi, setMateri] = useState(0);
  const [tugas, setTugas] = useState(0);
  const [kuis, setKuis] = useState(0);

  useEffect(() => {
    supabase
      .from("materi")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setMateri(count || 0));

    supabase
      .from("tugas_pengumpulan")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setTugas(count || 0));

    supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setKuis(count || 0));
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Progres Belajar</h1>

      <ul className="space-y-2">
        <li>📘 Total Materi: {materi}</li>
        <li>📝 Tugas Dikumpulkan: {tugas}</li>
        <li>🎯 Kuis Dikerjakan: {kuis}</li>
      </ul>
    </div>
  );
}
