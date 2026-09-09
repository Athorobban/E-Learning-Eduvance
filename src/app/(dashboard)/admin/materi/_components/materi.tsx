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
import Image from "next/image";

import DialogCreateMateri from "./dialog-create-materi";
import DialogUpdateMateri from "./dialog-update-materi";
import DialogDeleteMateri from "./dialog-delete-materi";
import { Materi } from "@/validations/materi-validation";

export default function MateriManagement() {
  const supabase = createClient();
  const { currentPage, currentLimit, currentSearch, handleChangePage, handleChangeLimit, handleChangeSearch } = useDataTable();

  // Fetch materi
  const {
    data: materi,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["materi", currentPage, currentLimit, currentSearch],
    queryFn: async () => {
      const query = supabase
        .from("materi")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * currentLimit, currentPage * currentLimit - 1);

      if (currentSearch) {
        query.or(`judul.ilike.%${currentSearch}%,kategori.ilike.%${currentSearch}%,kelas.ilike.%${currentSearch}%`);
      }

      const result = await query;
      if (result.error) {
        toast.error("Gagal mengambil data materi", {
          description: result.error.message,
        });
      }

      return result;
    },
  });

  const [selectedAction, setSelectedAction] = useState<{
    data: Materi;
    type: "update" | "delete";
  } | null>(null);

  const handleChangeAction = (open: boolean) => {
    if (!open) setSelectedAction(null);
  };

  const totalPages = materi?.count ? Math.ceil(materi.count / currentLimit) : 1;

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Materi Pembelajaran</h1>
          <p className="text-sm text-slate-600">Kelola materi pembelajaran untuk siswa dengan tampilan grid modern.</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Cari judul, kategori, atau kelas..." onChange={(e) => handleChangeSearch(e.target.value)} />
          <Dialog onOpenChange={handleChangeAction}>
            <DialogTrigger asChild>
              <Button variant="outline">Tambah Materi</Button>
            </DialogTrigger>
            <DialogCreateMateri refetch={refetch} />
          </Dialog>
        </div>
      </div>

      {/* GRID CARD MATERI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {(materi?.data || []).map((m: Materi) => {
          const thumbnail = typeof m.thumbnail_url === "string" ? m.thumbnail_url : null;
          const fileUrl = typeof m.file_url === "string" ? m.file_url : null;
          const videoUrl = typeof m.video_url === "string" ? m.video_url : null;

          return (
            <div key={m.id} className="bg-white rounded-xl shadow-md border hover:shadow-lg transition overflow-hidden flex flex-col">
              {/* THUMBNAIL */}
              <div className="w-full h-40 bg-slate-200 overflow-hidden">
                {thumbnail ? (
                  <Image src={thumbnail} alt={m.judul} width={320} height={200} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No Thumbnail</div>
                )}
              </div>

              {/* BODY */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-semibold truncate">{m.judul}</h3>

                <p className="text-xs text-slate-500 line-clamp-2">{m.deskripsi || "Tidak ada deskripsi"}</p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{m.kategori}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Kelas {m.kelas}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md">Pertemuan {m.pertemuan}</span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-4 border-t flex justify-between items-center">
                <div className="flex flex-col text-xs">
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" className="underline text-blue-600">
                      File Materi
                    </a>
                  )}
                  {videoUrl && (
                    <a href={videoUrl} target="_blank" className="underline text-blue-600">
                      Video Materi
                    </a>
                  )}
                </div>

                <div className="flex gap-3">
                  <Pencil className="w-5 h-5 text-slate-600 hover:text-blue-600 cursor-pointer" onClick={() => setSelectedAction({ data: m, type: "update" })} />
                  <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700 cursor-pointer" onClick={() => setSelectedAction({ data: m, type: "delete" })} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 pt-6">
        <Button variant="outline" onClick={() => handleChangePage(currentPage - 1)} disabled={currentPage === 1}>
          Prev
        </Button>

        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <Button variant="outline" onClick={() => handleChangePage(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>

      {/* DIALOG UPDATE / DELETE */}
      <DialogUpdateMateri open={selectedAction?.type === "update"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />

      <DialogDeleteMateri open={selectedAction?.type === "delete"} refetch={refetch} currentData={selectedAction?.data} handleChangeAction={handleChangeAction} />
    </div>
  );
}
