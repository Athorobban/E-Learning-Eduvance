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
import DialogCreateTugas from "./dialog-create-tugas";
import DialogUpdateTugas from "./dialog-update-tugas";
import DialogDeleteTugas from "./dialog-delete-tugas";
import { TugasForm } from "@/validations/tugas-validation";

export default function TugasManagement() {
  const supabase = createClient();
  const { currentPage, currentLimit, currentSearch, handleChangePage, handleChangeLimit, handleChangeSearch } = useDataTable();

  // GET DATA
  const {
    data: tugas,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tugas", currentPage, currentLimit, currentSearch],
    queryFn: async () => {
      let query = supabase
        .from("tugas")
        .select(
          `
          id,
          judul,
          deskripsi,
          deadline,
          file_url,
          guru_id,
          profiles:guru_id (
            name,
            role,
            avatar_url
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * currentLimit, currentPage * currentLimit - 1);

      if (currentSearch) {
        query.or(`judul.ilike.%${currentSearch}%,deskripsi.ilike.%${currentSearch}%`);
      }

      const result = await query;

      if (result.error) {
        toast.error("Gagal mengambil data tugas", {
          description: result.error.message,
        });
      }

      return result;
    },
  });

  const [selectedAction, setSelectedAction] = useState<{
    data: TugasForm;
    type: "update" | "delete";
  } | null>(null);

  const handleChangeAction = (open: boolean) => {
    if (!open) setSelectedAction(null);
  };

  const totalPages = tugas?.count ? Math.ceil(tugas.count / currentLimit) : 1;

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Tugas</h1>
          <p className="text-sm text-slate-600">Atur dan kelola tugas siswa.</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Cari judul atau deskripsi..." onChange={(e) => handleChangeSearch(e.target.value)} />
          <Dialog onOpenChange={handleChangeAction}>
            <DialogTrigger asChild>
              <Button variant="outline">Tambah Tugas</Button>
            </DialogTrigger>
            <DialogCreateTugas refetch={refetch} />
          </Dialog>
        </div>
      </div>

      {/* GRID CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {(tugas?.data || []).map((item: any) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md p-4 border hover:shadow-lg transition flex flex-col justify-between">
            {/* BODY */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg truncate">{item.judul}</h3>
              <p className="text-sm text-slate-600 mt-2 line-clamp-3">{item.deskripsi}</p>

              {/* Guru */}
              <p className="text-xs mt-3">
                <span className="font-medium">Guru:</span> {item.profiles?.name || "-"}
              </p>

              {/* Deadline */}
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md mt-2 inline-block">Deadline: {item.deadline ? new Date(item.deadline).toLocaleString() : "-"}</span>
            </div>

            {/* FOOTER */}
            <div className="mt-4 flex justify-between items-center pt-3 border-t">
              <div className="text-xs">
                {item.file_url ? (
                  <a className="text-blue-600 underline" href={item.file_url} target="_blank">
                    File Tugas
                  </a>
                ) : (
                  <span className="text-slate-400">Tidak ada file</span>
                )}
              </div>

              <div className="flex gap-3">
                <Pencil className="w-5 h-5 cursor-pointer text-slate-600 hover:text-blue-600" onClick={() => setSelectedAction({ data: item, type: "update" })} />
                <Trash2 className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-700" onClick={() => setSelectedAction({ data: item, type: "delete" })} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 pt-6">
        <Button variant="outline" onClick={() => handleChangePage(currentPage - 1)} disabled={currentPage === 1}>
          Prev
        </Button>

        <span className="text-sm font-medium">
          Page {currentPage} / {totalPages}
        </span>

        <Button variant="outline" onClick={() => handleChangePage(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>

      {/* DIALOG UPDATE & DELETE */}
      <DialogUpdateTugas open={selectedAction?.type === "update"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />

      <DialogDeleteTugas open={selectedAction?.type === "delete"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />
    </div>
  );
}
