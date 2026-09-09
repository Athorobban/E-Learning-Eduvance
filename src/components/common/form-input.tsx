import { FieldValues, Path, UseFormReturn, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FormInput<T extends FieldValues>({ form, name, label, placeholder, type = "text" }: { form: UseFormReturn<T>; name: Path<T>; label: string; placeholder?: string; type?: string }) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="space-y-2">
          <FieldLabel>{label}</FieldLabel>

          {/* Input diletakkan langsung di dalam Field tanpa FieldControl */}
          {type === "textarea" ? <Textarea {...field} placeholder={placeholder} autoComplete="off" className="resize-none" /> : <Input {...field} type={type} placeholder={placeholder} autoComplete="off" />}

          {/* FieldError bawaanmu sudah menangani logika null jika tidak ada error melalui props errors */}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
