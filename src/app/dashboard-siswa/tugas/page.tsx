import { Metadata } from "next";
import TugasPage from "./_components/tugas";
import QueryProvider from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Tugas Siswa",
};

export default function DashboardSiswaPage() {
  return (
    <QueryProvider>
      <TugasPage />
    </QueryProvider>
  );
}
