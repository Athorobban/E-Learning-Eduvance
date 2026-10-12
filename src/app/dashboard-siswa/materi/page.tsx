import { Metadata } from "next";
import QueryProvider from "@/providers/query-provider";
import MateriPage from "./_components/materi-siswa";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Materi Siswa",
};

export default function DashboardSiswaPage() {
  return (
    <QueryProvider>
      <MateriPage />
    </QueryProvider>
  );
}
