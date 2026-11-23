"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, CalendarClock, CheckCircle2, ClipboardCheck, Clock, ExternalLink, FileText, Loader2, MessageSquareText, Search, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { gradeTugasSubmission } from "../actions";

type Props = {
  initialTugasId?: string;
};

interface TugasOption {
  id: string;
  judul: string;
  deadline: string | null;
}

interface TugasInfo {
  id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  deadline: string | null;
  file_url: string | null;
  created_at: string;
}

interface SubmissionRow {
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
  siswa_name: string;
}

type FilterStatus = "all" | "submitted" | "graded";

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PengumpulanTugasPage({ initialTugasId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedTugasId, setSelectedTugasId] = useState<string>(initialTugasId ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  // State modal penilaian
  const [gradingTarget, setGradingTarget] = useState<SubmissionRow | null>(null);
  const [nilaiInput, setNilaiInput] = useState<string>("");
  const [catatanInput, setCatatanInput] = useState<string>("");

  useEffect(() => {
    if (initialTugasId) {
      setSelectedTugasId(initialTugasId);
    }
  }, [initialTugasId]);

  // 1. Ambil daftar semua tugas untuk dropdown perpindahan tugas
  const { data: tugasOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["admin-tugas-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tugas").select("id, judul, deadline").order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as TugasOption[];
    },
  });

  // Fallback otomatis ke tugas pertama jika halaman diakses tanpa ?id=
  useEffect(() => {
    if (!selectedTugasId && tugasOptions && tugasOptions.length > 0) {
      const defaultId = tugasOptions[0].id;
      setSelectedTugasId(defaultId);
      router.replace(`/admin/tugas/pengumpulan?id=${defaultId}`);
    }
  }, [selectedTugasId, tugasOptions, router]);

  // 2. Ambil detail tugas & seluruh pengumpulan siswa + nama siswa dari profiles
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-tugas-submissions", selectedTugasId],
    enabled: Boolean(selectedTugasId),
    queryFn: async () => {
      const [tugasRes, submissionsRes] = await Promise.all([
        supabase.from("tugas").select("*").eq("id", selectedTugasId).single(),
        supabase.from("tugas_pengumpulan").select("*").eq("tugas_id", selectedTugasId).order("submitted_at", { ascending: false }),
      ]);

      if (tugasRes.error || !tugasRes.data) {
        throw new Error("Data tugas tidak ditemukan.");
      }

      if (submissionsRes.error) {
        throw new Error(`Gagal memuat pengumpulan siswa: ${submissionsRes.error.message}`);
      }

      const rawSubmissions = submissionsRes.data ?? [];
      const siswaIds = Array.from(new Set(rawSubmissions.map((s) => s.siswa_id).filter(Boolean)));
      const siswaMap = new Map<string, string>();

      if (siswaIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", siswaIds);

        (profilesData ?? []).forEach((p) => {
          siswaMap.set(p.id, p.name || "Siswa Tanpa Nama");
        });
      }

      const mergedSubmissions: SubmissionRow[] = rawSubmissions.map((item) => ({
        ...item,
        siswa_name: siswaMap.get(item.siswa_id) ?? "Siswa Tidak Dikenal",
      }));

      return {
        tugas: tugasRes.data as TugasInfo,
        submissions: mergedSubmissions,
      };
    },
  });

  // 3. Mutation simpan nilai & catatan guru
  const gradeMutation = useMutation({
    mutationFn: async () => {
      if (!gradingTarget) throw new Error("Tidak ada pengumpulan yang dipilih.");

      const numericNilai = Number(nilaiInput);
      if (nilaiInput.trim() === "" || Number.isNaN(numericNilai)) {
        throw new Error("Harap masukkan angka nilai antara 0 hingga 100.");
      }

      const result = await gradeTugasSubmission({
        pengumpulan_id: gradingTarget.id,
        nilai: numericNilai,
        catatan_guru: catatanInput,
      });

      if (result.status === "error") {
        throw new Error(result.message);
      }

      return result;
    },
    onSuccess: (res) => {
      toast.success("Penilaian Tersimpan", { description: res.message });
      setGradingTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-tugas-submissions", selectedTugasId] });
      queryClient.invalidateQueries({ queryKey: ["tugas"] });
    },
    onError: (err: Error) => {
      toast.error("Gagal Menyimpan Nilai", { description: err.message });
    },
  });

  const handleOpenGrading = (row: SubmissionRow) => {
    setGradingTarget(row);
    setNilaiInput(row.nilai !== null ? String(row.nilai) : "");
    setCatatanInput(row.catatan_guru ?? "");
  };

  const handleSelectTugas = (newId: string) => {
    setSelectedTugasId(newId);
    setSearchQuery("");
    setStatusFilter("all");
    router.replace(`/admin/tugas/pengumpulan?id=${newId}`);
  };

  // Hitung statistik & filter daftar
  const { stats, filteredSubmissions } = useMemo(() => {
    const list = data?.submissions ?? [];
    const total = list.length;
    const gradedList = list.filter((s) => s.status === "graded");
    const ungradedCount = total - gradedList.length;
    const avgScore = gradedList.length > 0 ? Math.round(gradedList.reduce((acc, cur) => acc + (cur.nilai ?? 0), 0) / gradedList.length) : 0;

    const keyword = searchQuery.trim().toLowerCase();
    const filtered = list.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesKeyword = !keyword || item.siswa_name.toLowerCase().includes(keyword) || (item.jawaban_teks ?? "").toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });

    return {
      stats: {
        total,
        gradedCount: gradedList.length,
        ungradedCount,
        avgScore,
      },
      filteredSubmissions: filtered,
    };
  }, [data?.submissions, searchQuery, statusFilter]);

  if (isLoadingOptions || (Boolean(selectedTugasId) && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-400">
        <Loader2 className="size-9 animate-spin mb-3 text-primary" />
        <p className="text-sm font-medium">Memuat data pengumpulan siswa...</p>
      </div>
    );
  }

  if (!isLoadingOptions && (!tugasOptions || tugasOptions.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto mt-8 space-y-4">
        <ClipboardCheck className="size-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Belum Ada Tugas</h2>
        <p className="text-sm text-slate-500">Buat tugas terlebih dahulu di halaman Manajemen Tugas.</p>
        <Button asChild variant="outline">
          <Link href="/admin/tugas">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Manajemen Tugas
          </Link>
        </Button>
      </div>
    );
  }

  if (isError || !data?.tugas) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-8 space-y-4">
        <h2 className="text-lg font-bold text-rose-700">Gagal Memuat Halaman Penilaian</h2>
        <p className="text-sm text-slate-600">{error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data."}</p>
        <Button asChild variant="outline">
          <Link href="/admin/tugas">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Manajemen Tugas
          </Link>
        </Button>
      </div>
    );
  }

  const { tugas } = data;

  return (
    <div className="w-full space-y-6 pb-10">
      {/* TOP BAR: KEMBALI & PEMILIH TUGAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/admin/tugas" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors w-fit">
          <ArrowLeft className="size-4" />
          Kembali ke Manajemen Tugas
        </Link>

        {tugasOptions && tugasOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="switch-tugas" className="text-xs font-semibold text-slate-500 shrink-0">
              Tugas:
            </label>
            <select
              id="switch-tugas"
              value={selectedTugasId}
              onChange={(e) => handleSelectTugas(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary max-w-xs"
            >
              {tugasOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.judul}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* HEADER DETAIL TUGAS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">Evaluasi & Penilaian Tugas</span>
            <h1 className="text-2xl font-bold text-slate-900">{tugas.judul}</h1>
            {tugas.deskripsi && <p className="text-sm text-slate-600 max-w-3xl whitespace-pre-line">{tugas.deskripsi}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {tugas.deadline && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl">
                <CalendarClock className="size-4" />
                Deadline: {formatDateTime(tugas.deadline)}
              </span>
            )}
            {tugas.file_url && tugas.file_url !== "null" && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <a href={tugas.file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="size-4 mr-1.5" />
                  Soal Lampiran
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KARTU STATISTIK PENGUMPULAN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Dikumpulkan</span>
            <Users className="size-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Menunggu Dinilai</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{stats.ungradedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Sudah Dinilai</span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{stats.gradedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Rata-Rata Nilai</span>
            <Award className="size-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.avgScore}</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: `Semua (${stats.total})` },
              { key: "submitted", label: `Belum Dinilai (${stats.ungradedCount})` },
              { key: "graded", label: `Sudah Dinilai (${stats.gradedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Cari nama siswa atau jawaban..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
        </div>
      </div>

      {/* DAFTAR PENGUMPULAN SISWA */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          {stats.total === 0 ? "Belum ada siswa yang mengumpulkan tugas ini." : "Tidak ada pengumpulan siswa yang sesuai dengan filter pencarian."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubmissions.map((item) => {
            const isGraded = item.status === "graded";
            const isLate = tugas.deadline ? new Date(item.submitted_at) > new Date(tugas.deadline) : false;

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4 hover:border-slate-300 transition">
                <div className="space-y-3">
                  {/* IDENTITAS SISWA & STATUS */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{item.siswa_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">Dikumpulkan: {formatDateTime(item.submitted_at)}</span>
                        {isLate && <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">Terlambat</span>}
                      </div>
                    </div>

                    {isGraded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                        <CheckCircle2 className="size-3.5" />
                        Nilai: {item.nilai ?? 0}/100
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shrink-0">
                        <Clock className="size-3.5" />
                        Perlu Dinilai
                      </span>
                    )}
                  </div>

                  {/* PRATINJAU JAWABAN TEKS */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                      <MessageSquareText className="size-3.5" />
                      Jawaban Teks Siswa:
                    </p>
                    <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{item.jawaban_teks || "Siswa tidak mengisi jawaban teks."}</p>
                  </div>

                  {/* CATATAN GURU (JIKA SUDAH DINILAI) */}
                  {item.catatan_guru && (
                    <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 text-xs text-emerald-900">
                      <span className="font-bold">Catatan Guru: </span>
                      {item.catatan_guru}
                    </div>
                  )}
                </div>

                {/* FOOTER CARD: FILE JAWABAN & TOMBOL NILAI */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    {item.file_url ? (
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        <ExternalLink className="size-3.5" />
                        Buka File Jawaban
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Tanpa lampiran file</span>
                    )}
                  </div>

                  <Button type="button" size="sm" variant={isGraded ? "outline" : "default"} onClick={() => handleOpenGrading(item)} className="rounded-xl font-semibold">
                    <Award className="size-4 mr-1.5" />
                    {isGraded ? "Edit Nilai" : "Beri Nilai"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL / DIALOG PENILAIAN SISWA */}
      <Dialog open={Boolean(gradingTarget)} onOpenChange={(open) => !open && setGradingTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Penilaian Tugas Siswa</DialogTitle>
            <DialogDescription>
              Siswa: <strong className="text-slate-800">{gradingTarget?.siswa_name}</strong>
              {gradingTarget?.submitted_at && ` • Dikumpulkan ${formatDateTime(gradingTarget.submitted_at)}`}
            </DialogDescription>
          </DialogHeader>

          {gradingTarget && (
            <div className="space-y-5 py-2">
              {/* JAWABAN LENGKAP SISWA */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jawaban Teks Lengkap</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-slate-800 whitespace-pre-line">{gradingTarget.jawaban_teks || "Tidak ada jawaban teks yang dikirimkan."}</div>
              </div>

              {/* FILE LAMPIRAN JAWABAN */}
              {gradingTarget.file_url && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <span className="text-xs font-semibold text-blue-800">Siswa melampirkan file jawaban</span>
                  <Button asChild size="sm" variant="outline" className="bg-white rounded-lg">
                    <a href={gradingTarget.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5 mr-1.5" />
                      Lihat / Unduh File
                    </a>
                  </Button>
                </div>
              )}

              {/* INPUT NILAI (0 - 100) */}
              <div className="space-y-2">
                <label htmlFor="input-nilai" className="block text-sm font-bold text-slate-800">
                  Nilai Tugas (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <Input id="input-nilai" type="number" min={0} max={100} step={1} placeholder="Masukkan nilai (contoh: 85)" value={nilaiInput} onChange={(e) => setNilaiInput(e.target.value)} disabled={gradeMutation.isPending} />
              </div>

              {/* INPUT CATATAN GURU */}
              <div className="space-y-2">
                <label htmlFor="input-catatan" className="block text-sm font-bold text-slate-800">
                  Catatan Evaluasi Guru (Opsional)
                </label>
                <textarea
                  id="input-catatan"
                  rows={4}
                  placeholder="Berikan masukan atau apresiasi atas jawaban siswa..."
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  disabled={gradeMutation.isPending}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setGradingTarget(null)} disabled={gradeMutation.isPending}>
              Batal
            </Button>
            <Button type="button" onClick={() => gradeMutation.mutate()} disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Penilaian"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
