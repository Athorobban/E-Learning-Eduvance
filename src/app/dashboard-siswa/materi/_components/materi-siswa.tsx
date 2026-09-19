"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Materi = {
  id: string;
  judul: string;
  deskripsi: string | null;
  thumbnail_url: string | null;
};

export default function MateriPage() {
  const supabase = createClient();
  const [materi, setMateri] = useState<Materi[]>([]);

  useEffect(() => {
    supabase
      .from("materi")
      .select("id, judul, deskripsi, thumbnail_url")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setMateri(data || []);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Materi Pembelajaran</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {materi.map((m) => (
          <Link key={m.id} href={`/dashboard-siswa/materi/${m.id}`} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
            {/* Thumbnail */}
            <div className="h-40 bg-gray-100">
              {m.thumbnail_url ? <img src={m.thumbnail_url} alt={m.judul} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Tidak ada thumbnail</div>}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-lg line-clamp-2">{m.judul}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.deskripsi || "Tidak ada deskripsi"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
