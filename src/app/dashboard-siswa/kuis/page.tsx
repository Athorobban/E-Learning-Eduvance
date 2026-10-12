import { Metadata } from "next";
import KuisPage from "./_components/kuis";
import QueryProvider from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Quiz Siswa",
};

export default function DashboardSiswaPage() {
  return (
    <QueryProvider>
      <KuisPage />
    </QueryProvider>
  );
}
