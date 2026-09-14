"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function KuisPage() {
  const supabase = createClient();
  const [quiz, setQuiz] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("quizzes")
      .select("id, title")
      .then(({ data }) => setQuiz(data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Kuis</h1>

      {quiz.map((q) => (
        <Link key={q.id} href={`/dashboard-siswa/kuis/${q.id}`} className="block bg-white p-4 rounded-xl shadow mb-3">
          {q.title}
        </Link>
      ))}
    </div>
  );
}
