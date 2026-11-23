"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useDataTable from "@/hooks/use-data-table";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DialogCreateQuiz from "./dialog-create-quiz";
import DialogUpdateQuiz from "./dialog-update-quiz";
import DialogDeleteQuiz from "./dialog-delete-quiz";

type QuizCardItem = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  quiz_questions?: { id: string }[];
  creatorName: string;
};

export default function QuizManagement() {
  const supabase = createClient();
  const { currentPage, currentLimit, currentSearch, handleChangePage, handleChangeSearch } = useDataTable();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: quizzes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["quizzes", currentPage, currentLimit, currentSearch],
    queryFn: async () => {
      let query = supabase
        .from("quizzes")
        .select(
          `
            id,
            title,
            description,
            created_by,
            created_at,
            quiz_questions (
              id
            )
          `,
          { count: "exact" },
        )
        .range((currentPage - 1) * currentLimit, currentPage * currentLimit - 1)
        .order("created_at", { ascending: false });

      if (currentSearch.trim()) {
        const keyword = currentSearch.trim().replace(/,/g, "");
        query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      }

      const { data: quizRows, count, error } = await query;

      if (error) {
        toast.error("Gagal mengambil data kuis", {
          description: error.message,
        });
        throw error;
      }

      const rows = quizRows ?? [];
      const creatorIds = Array.from(new Set(rows.map((q) => q.created_by).filter(Boolean)));
      const creatorMap = new Map<string, string>();

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", creatorIds);

        (profiles ?? []).forEach((p) => {
          creatorMap.set(p.id, p.name);
        });
      }

      const merged: QuizCardItem[] = rows.map((q) => ({
        ...q,
        creatorName: creatorMap.get(q.created_by) ?? "-",
      }));

      return { data: merged, count: count ?? 0 };
    },
  });

  const [selectedAction, setSelectedAction] = useState<{
    data: QuizCardItem;
    type: "update" | "delete";
  } | null>(null);

  const handleChangeAction = (open: boolean) => {
    if (!open) setSelectedAction(null);
  };

  const totalPages = quizzes?.count ? Math.max(1, Math.ceil(quizzes.count / currentLimit)) : 1;

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Kuis</h1>
          <p className="text-sm text-slate-600">Buat dan kelola kuis evaluasi untuk siswa.</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Cari judul atau deskripsi kuis..." value={currentSearch} onChange={(e) => handleChangeSearch(e.target.value)} className="w-full sm:w-64" />

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 shrink-0">
                <Plus className="size-4" />
                Tambah Kuis
              </Button>
            </DialogTrigger>
            <DialogCreateQuiz refetch={refetch} onSuccess={() => setIsCreateOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* LOADING & EMPTY STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="size-8 animate-spin mb-2 text-primary" />
          <p className="text-sm">Memuat daftar kuis...</p>
        </div>
      ) : (quizzes?.data || []).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
          Belum ada kuis yang dibuat. Klik <strong>Tambah Kuis</strong> untuk membuat kuis pertama.
        </div>
      ) : (
        /* GRID CARD LIST */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(quizzes?.data || []).map((quiz) => (
            <div key={quiz.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-lg text-slate-900 line-clamp-1" title={quiz.title}>
                  {quiz.title}
                </h3>

                <p className="text-sm text-slate-600 line-clamp-3">{quiz.description || "Tidak ada deskripsi."}</p>

                <p className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">Pembuat:</span> {quiz.creatorName}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                    <HelpCircle className="size-3.5" />
                    {quiz.quiz_questions?.length || 0} Pertanyaan
                  </span>

                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md font-medium">
                    {new Date(quiz.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 mt-4">
                <span className="text-xs text-slate-400">Kelola</span>

                <div className="flex gap-3">
                  <button type="button" aria-label="Edit Kuis" onClick={() => setSelectedAction({ data: quiz, type: "update" })} className="text-slate-500 hover:text-blue-600 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" aria-label="Hapus Kuis" onClick={() => setSelectedAction({ data: quiz, type: "delete" })} className="text-red-500 hover:text-red-700 transition-colors">
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
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => handleChangePage(currentPage - 1)}>
          Prev
        </Button>

        <span className="text-sm font-medium text-slate-700">
          Page {currentPage} / {totalPages}
        </span>

        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => handleChangePage(currentPage + 1)}>
          Next
        </Button>
      </div>

      {/* MODALS */}
      <DialogUpdateQuiz open={selectedAction?.type === "update"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />

      <DialogDeleteQuiz open={selectedAction?.type === "delete"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />
    </div>
  );
}
