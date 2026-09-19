import { Metadata } from "next";
import AnswerAssignmentPage from "./_components/answer-assignment";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Detail Materi Siswa",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DashboardSiswaPage({ params }: PageProps) {
  return <AnswerAssignmentPage params={params} />;
}
