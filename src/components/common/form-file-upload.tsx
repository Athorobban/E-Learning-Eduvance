import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type FormFileUploadProps = {
  label?: string;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  multiple?: boolean;
  hint?: string;
};

export default function FormFileUpload({ label, value, onChange, accept, multiple = false, hint }: FormFileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      onChange(null);
      return;
    }

    const file = multiple ? files[0] : files[0];
    onChange(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}

      {/* Hidden input */}
      <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={(e) => handleFileSelected(e.target.files)} />

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Pilih {label ?? "File"}
        </Button>

        {/* Jika value adalah file lokal */}
        {value instanceof File && <p className="text-sm text-muted-foreground">{value.name}</p>}

        {/* Jika value adalah URL hasil upload */}
        {typeof value === "string" && value && (
          <a href={value} target="_blank" rel="noreferrer" className="text-sm underline">
            Lihat file
          </a>
        )}
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
