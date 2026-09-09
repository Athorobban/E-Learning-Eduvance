import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { FormEvent } from "react";
import { FieldValues, Path, UseFormReturn, Controller } from "react-hook-form";
import { CATEGORY_MATERI_LIST, KELAS_LIST } from "@/constants/materi-constant";
import { Preview } from "@/types/general";
import FormFileUpload from "@/components/common/form-file-upload";
import FormImage from "@/components/common/form-image";

export default function FormMateri<T extends FieldValues>({
  form,
  onSubmit,
  isLoading,
  type,
  preview,
  setPreview,
}: {
  form: UseFormReturn<T>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  type: "Create" | "Update";
  preview?: Preview;
  setPreview?: (preview: Preview) => void;
}) {
  const { control, formState } = form;

  return (
    <DialogContent className="max-w-xl rounded-xl p-0 overflow-hidden shadow-xl">
      <div className="bg-gradient-br from-white to-slate-50 p-6 border-b">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{type === "Create" ? "Tambah Materi Baru" : "Update Materi"}</DialogTitle>
          <DialogDescription>Isi form berikut dengan lengkap.</DialogDescription>
        </DialogHeader>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
        <FormInput form={form} name={"judul" as Path<T>} label="Judul Materi" placeholder="Masukkan judul materi" />

        <FormInput form={form} name={"deskripsi" as Path<T>} label="Deskripsi" placeholder="Masukkan deskripsi" type="textarea" />

        <FormSelect form={form} name={"kategori" as Path<T>} label="Kategori" selectItem={CATEGORY_MATERI_LIST} />

        <FormSelect form={form} name={"kelas" as Path<T>} label="Kelas" selectItem={KELAS_LIST} />

        <Controller
          control={control}
          name={"pertemuan" as Path<T>}
          render={({ field }) => {
            const error = (formState.errors as any)?.pertemuan;
            return (
              <div>
                <label className="block text-sm font-medium mb-1">Pertemuan</label>

                <input
                  type="number"
                  inputMode="numeric"
                  className={`w-full rounded-lg border px-3 py-2 shadow-sm bg-white ${error ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Masukkan pertemuan ke-?"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? undefined : Number(v));
                  }}
                />

                {error && <p className="text-xs text-red-500 mt-1">{String(error?.message)}</p>}
              </div>
            );
          }}
        />

        <Controller
          control={control}
          name={"file_url" as Path<T>}
          render={({ field }) => <FormFileUpload label="File Materi (PDF/DOC)" value={field.value} onChange={(file) => field.onChange(file)} accept=".pdf,.doc,.docx" hint="Format: PDF / DOC / DOCX" />}
        />

        <FormInput form={form} name={"video_url" as Path<T>} label="Video URL" placeholder="Link video" />

        <FormImage form={form} name={"thumbnail_url" as Path<T>} label="Thumbnail Materi" preview={preview} setPreview={setPreview} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Batal
            </Button>
          </DialogClose>
          <Button type="submit">{isLoading ? <Loader2 className="animate-spin" /> : type}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
