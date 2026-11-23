"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useDataTable from "@/hooks/use-data-table";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, FileText, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DialogCreateTugas from "./dialog-create-tugas";
import DialogUpdateTugas from "./dialog-update-tugas";
import DialogDeleteTugas from "./dialog-delete-tugas";
import { TugasForm } from "@/validations/tugas-validation";

type TugasRow = {
  id: string;
  judul: string;
  deskripsi: string | null;
  deadline: string | null;
  file_url: string | null;
  guru_id: string;
  created_at: string;
  guru?: {
    name: string;
    role: string;
  } | null;
  submissionStats: {
    total: number;
    ungraded: number;
  };
};

export default function TugasManagement() {
  const supabase = createClient();
  const { currentPage, currentLimit, currentSearch, handleChangePage, handleChangeSearch } = useDataTable();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: tugas,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tugas", currentPage, currentLimit, currentSearch],
    queryFn: async () => {
      let query = supabase
        .from("tugas")
        .select("id, judul, deskripsi, deadline, file_url, guru_id, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * currentLimit, currentPage * currentLimit - 1);

      if (currentSearch.trim()) {
        const keyword = currentSearch.trim().replace(/,/g, "");
        query = query.or(`judul.ilike.%${keyword}%,deskripsi.ilike.%${keyword}%`);
      }

      const { data: tugasRows, count, error } = await query;

      if (error) {
        toast.error("Gagal mengambil data tugas", {
          description: error.message,
        });
        throw error;
      }

      const rows = tugasRows || [];
      const guruIds = Array.from(new Set(rows.map((item) => item.guru_id).filter(Boolean)));
      const tugasIds = rows.map((item) => item.id);

      const [profilesRes, submissionsRes] = await Promise.all([
        guruIds.length > 0 ? supabase.from("profiles").select("id, name, role").in("id", guruIds) : Promise.resolve({ data: [] }),
        tugasIds.length > 0 ? supabase.from("tugas_pengumpulan").select("tugas_id, status").in("tugas_id", tugasIds) : Promise.resolve({ data: [] }),
      ]);

      const guruMap = new Map<string, { name: string; role: string }>();
      (profilesRes.data || []).forEach((profile) => {
        guruMap.set(profile.id, { name: profile.name, role: profile.role });
      });

      const statsMap = new Map<string, { total: number; ungraded: number }>();
      (submissionsRes.data || []).forEach((sub) => {
        const current = statsMap.get(sub.tugas_id) ?? { total: 0, ungraded: 0 };
        current.total += 1;
        if (sub.status === "submitted") current.ungraded += 1;
        statsMap.set(sub.tugas_id, current);
      });

      const mergedData: TugasRow[] = rows.map((item) => ({
        ...item,
        guru: guruMap.get(item.guru_id) ?? null,
        submissionStats: statsMap.get(item.id) ?? { total: 0, ungraded: 0 },
      }));

      return { data: mergedData, count: count ?? 0 };
    },
  });

  const [selectedAction, setSelectedAction] = useState<{
    data: TugasForm & { id?: string };
    type: "update" | "delete";
  } | null>(null);

  const handleChangeAction = (open: boolean) => {
    if (!open) setSelectedAction(null);
  };

  const totalPages = tugas?.count ? Math.max(1, Math.ceil(tugas.count / currentLimit)) : 1;

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tugas</h1>
          <p className="text-sm text-slate-600">Atur tugas dan nilai pengumpulan jawaban siswa.</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Cari judul atau deskripsi..." value={currentSearch} onChange={(e) => handleChangeSearch(e.target.value)} className="w-full sm:w-64" />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 shrink-0">
                <Plus className="size-4" />
                Tambah Tugas
              </Button>
            </DialogTrigger>
            <DialogCreateTugas refetch={refetch} onSuccess={() => setIsCreateOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="size-8 animate-spin mb-2 text-primary" />
          <p className="text-sm">Memuat daftar tugas...</p>
        </div>
      ) : (tugas?.data || []).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
          Belum ada tugas yang dibuat. Klik <strong>Tambah Tugas</strong> untuk mulai membuat tugas baru.
        </div>
      ) : (
        /* GRID CARD */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(tugas?.data || []).map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 hover:shadow-md transition flex flex-col justify-between">
              {/* BODY */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-900 line-clamp-1" title={item.judul}>
                  {item.judul}
                </h3>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{item.deskripsi || "Tidak ada deskripsi."}</p>

                {/* Pembuat Tugas */}
                <p className="text-xs text-slate-600 mt-3">
                  <span className="font-medium text-slate-800">Pembuat:</span> {item.guru?.name || "-"}
                </p>

                {/* Deadline */}
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md mt-2.5 inline-block font-medium">
                  Deadline:{" "}
                  {item.deadline
                    ? new Date(item.deadline).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Tanpa batas waktu"}
                </span>

                {/* Info Pengumpulan Siswa */}
                <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                    <Users className="size-3.5 text-blue-600" />
                    {item.submissionStats.total} Dikumpulkan
                  </span>
                  {item.submissionStats.ungraded > 0 && <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{item.submissionStats.ungraded} Baru</span>}
                </div>
              </div>

              {/* AKSI PENILAIAN */}
              <div className="mt-4">
                <Button asChild size="sm" variant="secondary" className="w-full font-semibold">
                  <Link href={`/admin/tugas/pengumpulan?id=${item.id}`}>
                    <ClipboardCheck className="size-4 mr-1.5 text-emerald-600" />
                    Nilai Pengumpulan
                  </Link>
                </Button>
              </div>

              {/* FOOTER */}
              <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-100">
                <div className="text-xs">
                  {item.file_url && item.file_url !== "null" ? (
                    <a className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium" href={item.file_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-3.5" />
                      File Tugas
                    </a>
                  ) : (
                    <span className="text-slate-400">Tidak ada file</span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" aria-label="Edit Tugas" onClick={() => setSelectedAction({ data: item as unknown as TugasForm, type: "update" })} className="text-slate-500 hover:text-blue-600 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" aria-label="Hapus Tugas" onClick={() => setSelectedAction({ data: item as unknown as TugasForm, type: "delete" })} className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <Button variant="outline" size="sm" onClick={() => handleChangePage(currentPage - 1)} disabled={currentPage <= 1}>
          Prev
        </Button>

        <span className="text-sm font-medium text-slate-700">
          Page {currentPage} / {totalPages}
        </span>

        <Button variant="outline" size="sm" onClick={() => handleChangePage(currentPage + 1)} disabled={currentPage >= totalPages}>
          Next
        </Button>
      </div>

      {/* DIALOG UPDATE & DELETE */}
      <DialogUpdateTugas open={selectedAction?.type === "update"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />

      <DialogDeleteTugas open={selectedAction?.type === "delete"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />
    </div>
  );
}
