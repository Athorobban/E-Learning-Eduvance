import QueryProvider from "@/providers/query-provider";
import TugasManagement from "./_components/tugas";

export const metadata = {
  title: "E-Learning Eduvance | Tugas Management",
};

export default function TugasManagementPage() {
  return (
    <QueryProvider>
      <TugasManagement />
    </QueryProvider>
  );
}
