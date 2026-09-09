"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useDataTable from "@/hooks/use-data-table";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import DialogCreateQuiz from "./dialog-create-quiz";
import DialogUpdateQuiz from "./dialog-update-quiz";
import DialogDeleteQuiz from "./dialog-delete-quiz";

export default function QuizManagement() {
  const supabase = createClient();

  const { currentPage, currentLimit, currentSearch, handleChangePage, handleChangeLimit, handleChangeSearch } = useDataTable();

  /* ============================
        FETCH QUIZ + RELATION
  ============================= */
  const {
    data: quizzes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["quizzes", currentPage, currentLimit, currentSearch],
    queryFn: async () => {
      const query = supabase
        .from("quizzes")
        .select(
          `
            *,
            quiz_questions (
                id
            )
          `,
          { count: "exact" },
        )
        .range((currentPage - 1) * currentLimit, currentPage * currentLimit - 1)
        .order("created_at", { ascending: false });

      if (currentSearch) {
        query.or(`title.ilike.%${currentSearch}%,description.ilike.%${currentSearch}%`);
      }

      const result = await query;

      if (result.error) {
        toast.error("Gagal mengambil data kuis", {
          description: result.error.message,
        });
      }

      return result;
    },
  });

  /* ============================
        MODAL ACTION HANDLER
  ============================= */
  const [selectedAction, setSelectedAction] = useState<{
    data: any;
    type: "update" | "delete";
  } | null>(null);

  const handleChangeAction = (open: boolean) => {
    if (!open) setSelectedAction(null);
  };

  /* ============================
        PAGINATION
  ============================= */
  const totalPages = quizzes?.count ? Math.ceil(quizzes.count / currentLimit) : 1;

  /* ============================
        RENDER CARD UI
  ============================= */
  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Kuis</h1>
          <p className="text-sm text-slate-600">Kelola kuis pembelajaran dengan tampilan kartu modern.</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Cari judul atau deskripsi kuis..." onChange={(e) => handleChangeSearch(e.target.value)} className="min-w-220px" />

          <Dialog onOpenChange={handleChangeAction}>
            <DialogTrigger asChild>
              <Button variant="outline">Tambah Kuis</Button>
            </DialogTrigger>
            <DialogCreateQuiz refetch={refetch} />
          </Dialog>
        </div>
      </div>

      {/* GRID CARD LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {(quizzes?.data || []).map((quiz: any) => (
          <div key={quiz.id} className="bg-white border rounded-xl shadow-sm hover:shadow-lg transition p-5 flex flex-col">
            {/* TITLE & DESCRIPTION */}
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-lg truncate">{quiz.title}</h3>

              <p className="text-sm text-slate-600 line-clamp-3">{quiz.description || "Tidak ada deskripsi"}</p>

              {/* TOTAL QUESTIONS */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{quiz.quiz_questions?.length || 0} Pertanyaan</span>

                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                  {new Date(quiz.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* FOOTER ACTION */}
            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <span className="text-xs text-slate-500">Aksi</span>

              <div className="flex gap-3">
                <Pencil className="w-5 h-5 cursor-pointer text-slate-600 hover:text-blue-600" onClick={() => setSelectedAction({ data: quiz, type: "update" })} />
                <Trash2 className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-700" onClick={() => setSelectedAction({ data: quiz, type: "delete" })} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 pt-6">
        <Button variant="outline" disabled={currentPage == 1} onClick={() => handleChangePage(currentPage - 1)}>
          Prev
        </Button>

        <span className="text-sm font-medium">
          Page {currentPage} / {totalPages}
        </span>

        <Button variant="outline" disabled={currentPage == totalPages} onClick={() => handleChangePage(currentPage + 1)}>
          Next
        </Button>
      </div>

      {/* MODALS */}
      <DialogUpdateQuiz open={selectedAction?.type === "update"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />

      <DialogDeleteQuiz open={selectedAction?.type === "delete"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />
    </div>
  );
}
