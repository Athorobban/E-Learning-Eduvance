import QueryProvider from "@/providers/query-provider";
import QuizManagement from "./_components/quiz";

export const metadata = {
  title: "E-Learning Eduvance | Quiz Management",
};

export default function QuizManagementPage() {
  return (
    <QueryProvider>
      <QuizManagement />
    </QueryProvider>
  );
}
