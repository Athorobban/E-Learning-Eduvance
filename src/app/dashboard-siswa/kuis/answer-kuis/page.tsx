import { Metadata } from "next";
import AnswerQuizPage from "./_components/answer-kuis";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Answer Quiz Siswa",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DashboardSiswaPage({ params }: PageProps) {
  return <AnswerQuizPage params={params} />;
}
