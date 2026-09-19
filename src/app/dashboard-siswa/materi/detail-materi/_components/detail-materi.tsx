"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getYoutubeEmbedUrl } from "@/utils/youtube";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DetailMateriPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();
  const [materi, setMateri] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("materi")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setMateri(data));
  }, [id]);

  useEffect(() => {
    async function trackView() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from("materi_views")
        .insert({
          materi_id: id,
          siswa_id: user.id,
        })
        .select()
        .single();
    }

    trackView();
  }, [id]);

  if (!materi) return <p>Memuat materi...</p>;

  const embedUrl = getYoutubeEmbedUrl(materi.video_url);

  return (
    <div className="space-y-6">
      {/* Judul */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-blue-700">{materi.judul}</h1>
        <p className="mt-3 text-gray-700">{materi.deskripsi}</p>
      </div>

      {/* VIDEO */}
      {embedUrl && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Video Pembelajaran</h2>
          <div className="aspect-video">
            <iframe src={embedUrl} className="w-full h-full rounded-lg" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* FILE */}
      {materi.file_url && (
        <div className="bg-white p-6 rounded-xl shadow">
          <a href={materi.file_url} target="_blank" className="text-blue-600 underline">
            📄 Unduh File Materi
          </a>
        </div>
      )}
    </div>
  );
}
