"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TugasPage() {
  const supabase = createClient();
  const [tugas, setTugas] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("tugas")
      .select("id, judul, deadline")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTugas(data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Tugas</h1>

      {tugas.map((t) => (
        <Link key={t.id} href={`/dashboard-siswa/tugas/${t.id}`} className="block bg-white p-4 rounded-xl shadow mb-3">
          <h3 className="font-semibold">{t.judul}</h3>
          <p className="text-sm text-gray-500">Deadline: {t.deadline ?? "-"}</p>
        </Link>
      ))}
    </div>
  );
}
