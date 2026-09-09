import { FieldValues, Path, UseFormReturn, Controller } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function FormSelect<T extends FieldValues>({
  form,
  name,
  label,
  selectItem,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  selectItem: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="space-y-2">
          <FieldLabel>{label}</FieldLabel>

          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger
              className={cn("w-full", {
                "border-destructive": fieldState.error, // pakai warna destructive bawaan tailwind/shadcn
              })}
            >
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{label}</SelectLabel>
                {selectItem.map((item) => (
                  <SelectItem key={item.label} value={item.value} disabled={item.disabled} className="capitalize">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
