import { Metadata } from "next";
import QueryProvider from "@/providers/query-provider";
import AnswerAssignmentPage from "./_components/answer-assignment";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Pengumpulan Tugas Siswa",
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AnswerAssignmentRoutePage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  return (
    <QueryProvider>
      <AnswerAssignmentPage initialTugasId={id} />
    </QueryProvider>
  );
}
