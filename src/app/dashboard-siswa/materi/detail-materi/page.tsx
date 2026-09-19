import { Metadata } from "next";
import DetailMateriPage from "./_components/detail-materi";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Detail Materi Siswa",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DashboardSiswaPage({ params }: PageProps) {
  return <DetailMateriPage params={params} />;
}
