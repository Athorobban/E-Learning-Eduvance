"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function KerjakanTugasPage({ params }: PageProps) {
  const { id } = use(params); // Next.js 16 fix
  const supabase = createClient();

  const [tugas, setTugas] = useState<any>(null);
  const [jawaban, setJawaban] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     AMBIL DATA TUGAS (FILE GURU)
  ========================= */
  useEffect(() => {
    supabase
      .from("tugas")
      .select("judul, deskripsi, deadline, file_url")
      .eq("id", id)
      .single()
      .then(({ data }) => setTugas(data));
  }, [id]);

  /* =========================
     AMBIL JAWABAN SISWA (JIKA ADA)
  ========================= */
  useEffect(() => {
    async function fetchSubmission() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase.from("tugas_pengumpulan").select("jawaban_teks, file_url").eq("tugas_id", id).eq("siswa_id", user.id).single();

      if (data) {
        setJawaban(data.jawaban_teks || "");
        setUploadedFileUrl(data.file_url);
      }
    }

    fetchSubmission();
  }, [id]);

  /* =========================
     SUBMIT TUGAS + UPLOAD FILE
  ========================= */
  async function submit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User belum login");
      return;
    }

    setLoading(true);
    let fileUrl = uploadedFileUrl;

    // Upload file jika ada
    if (file) {
      const filePath = `${id}/${user.id}/${file.name}`;

      const { error: uploadError } = await supabase.storage.from("tugas-files").upload(filePath, file, { upsert: true });

      if (uploadError) {
        alert("Gagal upload file");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from("tugas-files").getPublicUrl(filePath);

      fileUrl = data.publicUrl;
      setUploadedFileUrl(fileUrl);
    }

    // Simpan ke database
    const { error } = await supabase.from("tugas_pengumpulan").upsert({
      tugas_id: id,
      siswa_id: user.id,
      jawaban_teks: jawaban,
      file_url: fileUrl,
    });

    setLoading(false);

    if (error) {
      alert("Gagal mengirim tugas");
    } else {
      alert("Tugas berhasil dikumpulkan");
    }
  }

  if (!tugas) {
    return <p className="text-gray-500">Memuat tugas...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-2xl space-y-5">
      {/* INFO TUGAS */}
      <div>
        <h1 className="text-2xl font-bold text-blue-700">{tugas.judul}</h1>

        <p className="text-gray-700 mt-2">{tugas.deskripsi}</p>

        {tugas.deadline && <p className="text-sm text-gray-500 mt-1">Deadline: {new Date(tugas.deadline).toLocaleString()}</p>}
      </div>

      {/* FILE TUGAS DARI GURU */}
      {tugas.file_url && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          📄 File Tugas dari Guru:{" "}
          <a href={tugas.file_url} target="_blank" className="text-blue-600 underline font-medium">
            Unduh File
          </a>
        </div>
      )}

      {/* JAWABAN TEKS */}
      <textarea className="w-full border rounded-lg p-3 h-32" placeholder="Tulis jawaban kamu di sini..." value={jawaban} onChange={(e) => setJawaban(e.target.value)} />

      {/* UPLOAD FILE JAWABAN */}
      <div>
        <label className="block text-sm font-medium mb-1">Upload File Jawaban (PDF / DOC / Gambar)</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
      </div>

      {/* FILE JAWABAN SISWA */}
      {uploadedFileUrl && (
        <div className="text-sm">
          📎 File Jawaban Kamu:{" "}
          <a href={uploadedFileUrl} target="_blank" className="text-green-600 underline">
            Lihat File
          </a>
        </div>
      )}

      {/* BUTTON */}
      <button onClick={submit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60">
        {loading ? "Mengirim..." : "Submit"}
      </button>
    </div>
  );
}
