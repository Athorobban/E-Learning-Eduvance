import QueryProvider from "@/providers/query-provider";
import UserManagement from "./_components/user";

export const metadata = {
  title: "E-Learning Eduvance | User Management",
};

export default function UserManagementPage() {
  return (
    <QueryProvider>
      <UserManagement />
    </QueryProvider>
  );
}
