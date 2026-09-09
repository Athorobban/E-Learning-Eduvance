import FormInput from "@/components/common/form-input";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { FormEvent } from "react";
import { FieldValues, Path, UseFormReturn, Controller } from "react-hook-form";
import FormFileUpload from "@/components/common/form-file-upload";

export default function FormTugas<T extends FieldValues>({ form, onSubmit, isLoading, type }: { form: UseFormReturn<T>; onSubmit: (event: FormEvent<HTMLFormElement>) => void; isLoading: boolean; type: "Create" | "Update" }) {
  return (
    <DialogContent className="max-w-lg rounded-xl p-0 overflow-hidden shadow-xl">
      <div className="bg-gradient-br from-white to-slate-50 p-6 border-b">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{type === "Create" ? "Buat Tugas Baru" : "Edit Tugas"}</DialogTitle>
          <DialogDescription>Isi form tugas dengan lengkap.</DialogDescription>
        </DialogHeader>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
        {/* JUDUL */}
        <FormInput form={form} name={"judul" as Path<T>} label="Judul Tugas" placeholder="Masukkan judul" />

        {/* DESKRIPSI */}
        <FormInput form={form} name={"deskripsi" as Path<T>} label="Deskripsi" type="textarea" placeholder="Masukkan deskripsi tugas" />

        {/* DEADLINE */}
        <FormInput form={form} name={"deadline" as Path<T>} label="Deadline" type="datetime-local" />

        {/* FILE */}
        <Controller
          control={form.control}
          name={"file_url" as Path<T>}
          render={({ field }) => <FormFileUpload label="File Tugas (PDF/DOC)" value={(field.value ?? null) as File | string | null} onChange={(file) => field.onChange(file)} accept=".pdf,.doc,.docx" />}
        />

        {/* FOOTER */}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : type}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
