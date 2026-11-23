import { Metadata } from "next";
import QueryProvider from "@/providers/query-provider";
import AnswerQuizPage from "./_components/answer-kuis";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Pengerjaan Kuis Siswa",
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AnswerQuizRoutePage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  return (
    <QueryProvider>
      <AnswerQuizPage initialQuizId={id} />
    </QueryProvider>
  );
}
