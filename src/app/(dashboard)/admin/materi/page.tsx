import QueryProvider from "@/providers/query-provider";
import MateriManagement from "./_components/materi";

export const metadata = {
  title: "E-Learning Eduvance | Materi Management",
};

export default function MateriManagementPage() {
  return (
    <QueryProvider>
      <MateriManagement />
    </QueryProvider>
  );
}
