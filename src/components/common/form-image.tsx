import { FieldValues, Path, UseFormReturn, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileImage } from "lucide-react";
import { getImageData } from "@/lib/utils";

export default function FormImage<T extends FieldValues>({
  form,
  name,
  label,
  preview,
  setPreview,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  preview?: {
    file: File;
    displayUrl: string;
  };
  setPreview?: (preview: { file: File; displayUrl: string }) => void;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field: { onChange, ref, name, onBlur, disabled }, fieldState }) => (
        <Field className="space-y-2">
          <FieldLabel>{label}</FieldLabel>

          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={preview?.displayUrl} alt="preview" className="object-cover" />
              <AvatarFallback className="rounded-lg">
                <FileImage className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Input
              type="file"
              name={name}
              ref={ref}
              onBlur={onBlur}
              disabled={disabled}
              onChange={async (event) => {
                onChange(event);
                const { file, displayUrl } = getImageData(event);
                if (file) {
                  setPreview?.({
                    file,
                    displayUrl,
                  });
                }
              }}
            />
          </div>

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
