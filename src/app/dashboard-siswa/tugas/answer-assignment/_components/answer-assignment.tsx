"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, FileCheck, Loader2, MessageSquare, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AnswerAssignmentPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = createClient();

  const [jawaban, setJawaban] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data Tugas dan Jawaban Siswa
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tugas-detail", id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User belum login");

      // Fetch detail tugas
      const { data: tugasData, error: tugasError } = await supabase.from("tugas").select("*").eq("id", id).single();

      if (tugasError) throw tugasError;

      // Fetch pengumpulan siswa jika ada
      const { data: pengumpulanData } = await supabase.from("tugas_pengumpulan").select("*").eq("tugas_id", id).eq("siswa_id", user.id).single();

      return { tugas: tugasData, pengumpulan: pengumpulanData, user };
    },
  });

  // Sinkronisasi state lokal dengan data dari database saat selesai fetching
  useEffect(() => {
    if (data?.pengumpulan) {
      setJawaban(data.pengumpulan.jawaban_teks || "");
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!data?.user) {
      toast.error("Gagal Mengirim", { description: "Anda harus login terlebih dahulu." });
      return;
    }

    if (!jawaban.trim() && !file && !data?.pengumpulan?.file_url) {
      toast.error("Validasi Gagal", { description: "Harap isi teks jawaban atau unggah file tugas Anda." });
      return;
    }

    setIsSubmitting(true);
    let finalFileUrl = data?.pengumpulan?.file_url; // Gunakan file lama jika tidak ada yang baru

    try {
      // 1. Upload File (Jika siswa memilih file baru)
      if (file) {
        // Format penamaan file yang aman
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `jawaban/${id}/${data.user.id}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage.from("tugas-files").upload(filePath, file, { upsert: true });

        if (uploadError) throw new Error("Gagal mengunggah file. Pastikan ukuran file sesuai.");

        // Dapatkan Public URL
        const { data: publicUrlData } = supabase.storage.from("tugas-files").getPublicUrl(filePath);
        finalFileUrl = publicUrlData.publicUrl;
      }

      // 2. Simpan ke Database
      const { error: dbError } = await supabase.from("tugas_pengumpulan").upsert(
        {
          tugas_id: id,
          siswa_id: data.user.id,
          jawaban_teks: jawaban,
          file_url: finalFileUrl,
          status: "submitted",
          submitted_at: new Date().toISOString(), // Update waktu pengumpulan
        },
        {
          onConflict: "tugas_id,siswa_id", // Berdasarkan unique index
        },
      );

      if (dbError) throw dbError;

      toast.success("Berhasil!", { description: "Tugas kamu berhasil dikumpulkan." });
      setFile(null); // Reset input file
      refetch(); // Segarkan data UI
    } catch (err: any) {
      toast.error("Terjadi Kesalahan", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-emerald-500" />
        <p className="font-medium animate-pulse">Menyiapkan lembar tugas...</p>
      </div>
    );
  }

  if (!data?.tugas) return null;

  const { tugas, pengumpulan } = data;
  const isGraded = pengumpulan?.status === "graded";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <Link href="/dashboard-siswa/tugas" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium">
        <ArrowLeft className="size-4" /> Kembali ke Daftar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: INFO TUGAS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl inline-block mb-4">
              <FileText className="size-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{tugas.judul}</h1>

            {tugas.deadline && (
              <div className="inline-block bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg mb-4 border border-rose-100">
                Tenggat: {new Date(tugas.deadline).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            )}

            <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{tugas.deskripsi}</p>

            {tugas.file_url && (
              <a
                href={tugas.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <FileCheck className="size-4 text-emerald-500" />
                Unduh Lampiran Soal
              </a>
            )}
          </div>

          {/* KOTAK HASIL NILAI (Jika sudah dinilai) */}
          {isGraded && (
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-emerald-800">Hasil Evaluasi</h3>
                <Award className="size-6 text-emerald-600" />
              </div>
              <div className="text-5xl font-extrabold text-emerald-600 mb-4">
                {pengumpulan.nilai}
                <span className="text-xl text-emerald-400">/100</span>
              </div>
              {pengumpulan.catatan_guru && (
                <div className="bg-white/60 p-4 rounded-2xl text-sm text-emerald-800 border border-emerald-100">
                  <span className="font-bold block mb-1">Catatan Guru:</span>"{pengumpulan.catatan_guru}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: FORM PENGUMPULAN */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MessageSquare className="size-5 text-blue-500" /> Lembar Jawaban
            </h2>

            <div className="space-y-6">
              {/* Input Teks */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jawaban Teks</label>
                <textarea
                  className="w-full border border-slate-200 rounded-2xl p-4 min-h-[200px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-y disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder={isGraded ? "Tugas ini sudah dinilai." : "Ketik jawabanmu di sini..."}
                  value={jawaban}
                  onChange={(e) => setJawaban(e.target.value)}
                  disabled={isSubmitting || isGraded}
                />
              </div>

              {/* Input File */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Unggah File (Opsional)</label>

                {/* File saat ini di database */}
                {pengumpulan?.file_url && (
                  <div className="mb-3 flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-sm">
                    <CheckCircle2 className="size-4" />
                    Kamu sudah mengunggah file:
                    <a href={pengumpulan.file_url} target="_blank" className="font-bold underline ml-1">
                      Lihat File
                    </a>
                  </div>
                )}

                {/* File picker */}
                {!isGraded && (
                  <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 rounded-2xl p-6 transition-colors text-center cursor-pointer">
                    <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isSubmitting} />
                    <UploadCloud className="size-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">{file ? file.name : "Klik atau seret file ke sini (PDF, DOC, Gambar)"}</p>
                  </div>
                )}
              </div>

              {/* Tombol Aksi */}
              {!isGraded && (
                <div className="pt-4 border-t border-slate-100">
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-md font-bold text-white shadow-md">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-5 animate-spin" /> Menyimpan...
                      </>
                    ) : pengumpulan ? (
                      "Perbarui Pengumpulan"
                    ) : (
                      "Kirim Tugas Sekarang"
                    )}
                  </Button>
                  <p className="text-center text-xs text-slate-400 mt-3">Kamu bisa memperbarui jawaban sebelum tenggat waktu berakhir.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
