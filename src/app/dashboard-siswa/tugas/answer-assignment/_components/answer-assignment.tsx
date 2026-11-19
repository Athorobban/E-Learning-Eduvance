"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, CalendarClock, CheckCircle2, ClipboardList, Clock, FileCheck, FileText, Loader2, MessageSquare, ShieldAlert, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { submitAssignmentAction } from "../actions";

type AnswerAssignmentProps = {
  initialTugasId?: string;
};

interface TugasOption {
  id: string;
  judul: string;
  deadline: string | null;
}

interface TugasDetail {
  id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  deadline: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

interface TugasPengumpulan {
  id: string;
  tugas_id: string;
  siswa_id: string;
  jawaban_teks: string | null;
  file_url: string | null;
  nilai: number | null;
  catatan_guru: string | null;
  status: "submitted" | "graded";
  submitted_at: string;
  graded_at: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp"];

const submissionFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "File tidak boleh kosong.")
  .refine((file) => file.size <= MAX_FILE_SIZE, "Ukuran file maksimal 10 MB.")
  .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), "Format file harus berupa PDF, DOC, DOCX, JPG, PNG, atau WEBP.");

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AnswerAssignmentPage({ initialTugasId }: AnswerAssignmentProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedTugasId, setSelectedTugasId] = useState<string>(initialTugasId ?? "");
  const [jawaban, setJawaban] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialTugasId) {
      setSelectedTugasId(initialTugasId);
    }
  }, [initialTugasId]);

  // 1. Ambil daftar tugas yang tersedia
  const { data: tugasOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["tugas-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tugas").select("id, judul, deadline").order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as TugasOption[];
    },
  });

  useEffect(() => {
    if (!selectedTugasId && tugasOptions && tugasOptions.length > 0) {
      const defaultId = tugasOptions[0].id;
      setSelectedTugasId(defaultId);
      router.replace(`/dashboard-siswa/tugas/answer-assignment?id=${defaultId}`);
    }
  }, [selectedTugasId, tugasOptions, router]);

  // 2. Fetch detail tugas terpilih & status pengumpulan siswa
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tugas-detail", selectedTugasId],
    enabled: Boolean(selectedTugasId),
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
      }

      const { data: tugasData, error: tugasError } = await supabase.from("tugas").select("*").eq("id", selectedTugasId).single();

      if (tugasError || !tugasData) {
        throw new Error("Tugas tidak ditemukan atau Anda tidak memiliki akses.");
      }

      const { data: pengumpulanData, error: pengumpulanError } = await supabase.from("tugas_pengumpulan").select("*").eq("tugas_id", selectedTugasId).eq("siswa_id", user.id).maybeSingle();

      if (pengumpulanError) {
        throw new Error("Gagal memuat status pengumpulan tugas.");
      }

      return {
        tugas: tugasData as TugasDetail,
        pengumpulan: pengumpulanData as TugasPengumpulan | null,
      };
    },
  });

  useEffect(() => {
    setJawaban(data?.pengumpulan?.jawaban_teks ?? "");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedTugasId, data?.pengumpulan]);

  const handleSelectTugas = (newId: string) => {
    setSelectedTugasId(newId);
    router.replace(`/dashboard-siswa/tugas/answer-assignment?id=${newId}`);
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = submissionFileSchema.safeParse(selectedFile);
    if (!validation.success) {
      toast.error("File Tidak Valid", {
        description: validation.error.issues[0]?.message,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  };

  // 3. Submit melalui Server Action
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTugasId) {
        throw new Error("Tugas belum dipilih.");
      }

      const trimmedJawaban = jawaban.trim();
      const existingFileUrl = data?.pengumpulan?.file_url ?? null;

      if (!trimmedJawaban && !file && !existingFileUrl) {
        throw new Error("Harap isi jawaban teks atau unggah file jawaban terlebih dahulu.");
      }

      const formData = new FormData();
      formData.append("tugas_id", selectedTugasId);
      formData.append("jawaban_teks", trimmedJawaban);

      if (file) {
        formData.append("file", file);
      }

      const result = await submitAssignmentAction(formData);

      if (result.status === "error") {
        throw new Error(result.message);
      }

      return result;
    },
    onSuccess: (res) => {
      toast.success("Tugas Berhasil Dikumpulkan", {
        description: res.message,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["tugas-detail", selectedTugasId] });
      queryClient.invalidateQueries({ queryKey: ["tugas-siswa"] });
    },
    onError: (err: Error) => {
      toast.error("Pengumpulan Gagal", {
        description: err.message,
      });
    },
  });

  if (isLoadingOptions || (Boolean(selectedTugasId) && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-400">
        <Loader2 className="size-10 animate-spin mb-4 text-emerald-600" />
        <p className="font-medium animate-pulse">Menyiapkan lembar tugas...</p>
      </div>
    );
  }

  if (!isLoadingOptions && (!tugasOptions || tugasOptions.length === 0)) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="size-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <ClipboardList className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Belum Ada Tugas Tersedia</h2>
        <p className="text-sm text-slate-500">Guru belum menambahkan tugas baru untuk dikerjakan.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard-siswa/tugas">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Daftar Tugas
          </Link>
        </Button>
      </div>
    );
  }

  if (isError || !data?.tugas) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="size-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tugas Tidak Dapat Dimuat</h2>
        <p className="text-sm text-slate-500">{error instanceof Error ? error.message : "Tugas tidak ditemukan atau akses ditolak."}</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard-siswa/tugas">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Daftar Tugas
          </Link>
        </Button>
      </div>
    );
  }

  const { tugas, pengumpulan } = data;
  const isGraded = pengumpulan?.status === "graded";
  const isOverdue = tugas.deadline ? new Date() > new Date(tugas.deadline) : false;
  const isLocked = isGraded || isOverdue;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/dashboard-siswa/tugas" className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium">
          <ArrowLeft className="size-4" /> Kembali ke Daftar Tugas
        </Link>

        {tugasOptions && tugasOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="select-tugas" className="text-xs font-semibold text-slate-500 shrink-0">
              Pilih Tugas:
            </label>
            <select
              id="select-tugas"
              value={selectedTugasId}
              onChange={(e) => handleSelectTugas(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 max-w-xs"
            >
              {tugasOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.judul}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: SOAL DARI GURU */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl inline-block mb-4">
              <FileText className="size-6" />
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-3 leading-snug">{tugas.judul}</h1>

            {tugas.deadline && (
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg mb-4 border ${isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                <CalendarClock className="size-3.5" />
                {isOverdue ? "Tenggat Berakhir: " : "Tenggat: "}
                {formatDateTime(tugas.deadline)}
              </div>
            )}

            <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{tugas.deskripsi || "Tidak ada deskripsi tambahan dari guru."}</p>

            {tugas.file_url && tugas.file_url !== "null" && (
              <a
                href={tugas.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <FileCheck className="size-4 text-emerald-600" />
                Unduh Lampiran Soal
              </a>
            )}
          </div>

          {isGraded && pengumpulan && (
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-emerald-900">Hasil Evaluasi</h3>
                <Award className="size-6 text-emerald-600" />
              </div>

              <div className="text-5xl font-extrabold text-emerald-600">
                {pengumpulan.nilai ?? 0}
                <span className="text-xl text-emerald-500">/100</span>
              </div>

              {pengumpulan.graded_at && (
                <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Dinilai pada {formatDateTime(pengumpulan.graded_at)}
                </p>
              )}

              {pengumpulan.catatan_guru && (
                <div className="bg-white/80 p-4 rounded-2xl text-sm text-emerald-900 border border-emerald-100">
                  <span className="font-bold block mb-1">Catatan Guru:</span>
                  <p className="whitespace-pre-line">&ldquo;{pengumpulan.catatan_guru}&rdquo;</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: FORM JAWABAN SISWA */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="size-5 text-blue-600" />
                Lembar Jawaban Siswa
              </h2>

              {pengumpulan?.submitted_at && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Terkirim: {formatDateTime(pengumpulan.submitted_at)}</span>}
            </div>

            {isOverdue && !isGraded && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
                <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Waktu Pengumpulan Telah Habis</p>
                  <p className="text-xs mt-0.5">{pengumpulan ? "Jawaban terakhir kamu sudah tersimpan dan tidak dapat diubah lagi." : "Kamu tidak dapat mengirim jawaban karena tenggat waktu telah berlalu."}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="jawaban-teks" className="block text-sm font-bold text-slate-700 mb-2">
                  Jawaban Teks
                </label>
                <textarea
                  id="jawaban-teks"
                  className="w-full border border-slate-200 rounded-2xl p-4 min-h-[200px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-y disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder={isGraded ? "Tugas ini sudah dinilai oleh guru." : isOverdue ? "Tenggat waktu telah berakhir." : "Ketik jawaban tugasmu secara lengkap di sini..."}
                  value={jawaban}
                  onChange={(e) => setJawaban(e.target.value)}
                  disabled={submitMutation.isPending || isLocked}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Lampiran File Jawaban (Opsional, Maks. 10 MB)</label>

                {pengumpulan?.file_url && (
                  <div className="mb-3 flex items-center justify-between gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>File jawaban tersimpan di server</span>
                    </div>
                    <a href={pengumpulan.file_url} target="_blank" rel="noopener noreferrer" className="font-bold underline shrink-0">
                      Lihat File
                    </a>
                  </div>
                )}

                {!isLocked && (
                  <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 rounded-2xl p-6 transition-colors text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={submitMutation.isPending}
                    />
                    <UploadCloud className="size-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">{file ? file.name : "Klik atau seret file ke sini (PDF, DOC, DOCX, Gambar)"}</p>
                    <p className="text-xs text-slate-400 mt-1">Ukuran maksimal file 10 MB</p>
                  </div>
                )}

                {file && !isLocked && (
                  <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs text-emerald-800">
                    <span className="truncate font-medium">
                      File siap diunggah: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button type="button" onClick={() => handleFileChange(null)} className="text-rose-600 hover:text-rose-800 p-1" aria-label="Batalkan file">
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {!isLocked && (
                <div className="pt-4 border-t border-slate-100">
                  <Button type="button" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-md font-bold text-white shadow-md">
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-5 animate-spin" /> Mengirim Jawaban...
                      </>
                    ) : pengumpulan ? (
                      "Perbarui Pengumpulan Tugas"
                    ) : (
                      "Kirim Tugas Sekarang"
                    )}
                  </Button>
                  <p className="text-center text-xs text-slate-400 mt-3">Kamu dapat memperbarui jawaban selama tenggat waktu belum berakhir dan tugas belum dinilai.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
