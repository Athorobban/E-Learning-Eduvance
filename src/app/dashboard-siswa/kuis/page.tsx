import { Metadata } from "next";
import KuisPage from "./_components/kuis";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Dashboard Quiz Siswa",
};

export default function DashboardSiswaPage() {
  return <KuisPage />;
}
