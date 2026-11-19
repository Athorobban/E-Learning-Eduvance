import { Metadata } from "next";
import QueryProvider from "@/providers/query-provider";
import DetailMateriPage from "./_components/detail-materi";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Detail Materi Siswa",
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function DashboardDetailMateri({ searchParams }: PageProps) {
  const { id } = await searchParams;

  return (
    <QueryProvider>
      <DetailMateriPage initialMateriId={id} />
    </QueryProvider>
  );
}
