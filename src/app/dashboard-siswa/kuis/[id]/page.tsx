"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function KerjakanKuisPage({ params }: PageProps) {
  const { id } = use(params); // ✅ FIX
  const supabase = createClient();
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("quiz_questions")
      .select(
        `
        id,
        question_text,
        quiz_options (
          id,
          option_text
        )
      `,
      )
      .eq("quiz_id", id)
      .then(({ data, error }) => {
        if (!error) setQuestions(data || []);
      });
  }, [id]);

  if (!questions.length) {
    return <p className="text-gray-500">Memuat soal kuis...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-3xl">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Kuis</h1>

      {questions.map((q, index) => (
        <div key={q.id} className="mb-4">
          <p className="font-medium">
            {index + 1}. {q.question_text}
          </p>

          <div className="mt-2 space-y-2">
            {q.quiz_options.map((o: any) => (
              <label key={o.id} className="flex items-center gap-2">
                <input type="radio" name={q.id} />
                {o.option_text}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
