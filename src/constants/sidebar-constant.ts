import { BookOpenCheck, LayoutDashboard, LibraryBig, NotebookPen, Users } from "lucide-react";

export const SIDEBAR_MENU_LIST = {
  Admin: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Materi",
      url: "/admin/materi",
      icon: LibraryBig,
    },
    {
      title: "Quiz",
      url: "/admin/quiz",
      icon: NotebookPen,
    },
    {
      title: "Tugas",
      url: "/admin/tugas",
      icon: BookOpenCheck,
    },
    {
      title: "User",
      url: "/admin/user",
      icon: Users,
    },
  ],
  Guru: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Materi",
      url: "/admin/materi",
      icon: LibraryBig,
    },
    {
      title: "Quiz",
      url: "/admin/quiz",
      icon: NotebookPen,
    },
    {
      title: "Tugas",
      url: "/admin/tugas",
      icon: BookOpenCheck,
    },
  ],
};

export type SidebarMenuKey = keyof typeof SIDEBAR_MENU_LIST;
