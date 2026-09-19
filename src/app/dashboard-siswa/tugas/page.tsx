import { Metadata } from "next";
import TugasPage from "./_components/tugas";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Tugas Siswa",
};

export default function DashboardSiswaPage() {
  return <TugasPage />;
}
