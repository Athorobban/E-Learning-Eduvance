import { Metadata } from "next";
import QueryProvider from "@/providers/query-provider";
import PengumpulanTugasPage from "./_components/pengumpulan-tugas";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Penilaian Tugas Siswa",
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminPengumpulanTugasRoute({ searchParams }: PageProps) {
  const { id } = await searchParams;

  return (
    <QueryProvider>
      <PengumpulanTugasPage initialTugasId={id} />
    </QueryProvider>
  );
}
