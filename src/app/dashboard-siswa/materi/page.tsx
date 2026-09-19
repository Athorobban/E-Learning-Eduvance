import { Metadata } from "next";
import MateriPage from "./_components/materi-siswa";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Materi Siswa",
};

export default function DashboardSiswaPage() {
  return <MateriPage />;
}
