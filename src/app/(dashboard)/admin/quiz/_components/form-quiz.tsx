"use client";

import React from "react";
import { UseFormReturn, useFieldArray, Controller } from "react-hook-form";
import FormInput from "@/components/common/form-input";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, X } from "lucide-react";
import { QuizForm } from "@/validations/quiz-validation";

type Props = {
  form: UseFormReturn<QuizForm>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  type: "Create" | "Update";
};

export default function FormQuiz({ form, onSubmit, isLoading, type }: Props) {
  const { control, register } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const handleAddQuestion = () => {
    append({
      question_text: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    });
  };

  return (
    <DialogContent className="sm:max-w-700px max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>{type} Kuis</DialogTitle>
        <DialogDescription>{type === "Create" ? "Tambah kuis pembelajaran baru" : "Edit kuis pembelajaran"}</DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
          <FormInput form={form as any} name={"title"} label="Judul Kuis" placeholder="Masukkan judul kuis" />
          <FormInput form={form as any} name={"description"} label="Deskripsi" placeholder="Masukkan deskripsi kuis" type="textarea" />

          <div className="flex items-center justify-between mt-4">
            <h3 className="font-semibold text-lg">Pertanyaan</h3>
            <Button type="button" size="sm" onClick={handleAddQuestion}>
              <PlusCircle className="w-4 h-4 mr-1" /> Tambah Pertanyaan
            </Button>
          </div>

          {fields.map((item, qIndex) => (
            <div key={item.id} className="bg-slate-50 rounded-md p-4 border space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Pertanyaan {qIndex + 1}</h4>
                <Button variant="destructive" size="icon" type="button" onClick={() => remove(qIndex)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* question_text */}
              <FormInput form={form as any} name={`questions.${qIndex}.question_text`} label="Teks Pertanyaan" placeholder="Masukkan teks pertanyaan" />

              {/* options (4) */}
              <div>
                <h5 className="font-medium mb-2">Pilihan Jawaban (pilih 1 benar)</h5>

                {[0, 1, 2, 3].map((oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3 bg-white border p-2 rounded-md mb-2">
                    {/* Radio controlled via Controller */}
                    <Controller
                      control={control}
                      name={`questions.${qIndex}.correctIndex` as any}
                      render={({ field }) => <input type="radio" checked={field.value === oIndex} onChange={() => field.onChange(oIndex)} aria-label={`Correct answer ${oIndex}`} />}
                    />

                    <input
                      type="text"
                      placeholder={`Pilihan ${oIndex + 1}`}
                      {...(register(
                        // cast to any to satisfy generic Path typing
                        `questions.${qIndex}.options.${oIndex}` as any,
                      ) as any)}
                      className="flex-1 border rounded px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>

          <Button type="submit">{isLoading ? <Loader2 className="animate-spin" /> : type}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
