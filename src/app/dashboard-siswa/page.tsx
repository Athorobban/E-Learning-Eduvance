import { Metadata } from "next";
import DashboardClient from "./_components/dashboard-client";

export const metadata: Metadata = {
  title: "E-Learning Eduvance | Smart Learning Platform",
};

export default function DashboardSiswaPage() {
  return <DashboardClient />;
}
