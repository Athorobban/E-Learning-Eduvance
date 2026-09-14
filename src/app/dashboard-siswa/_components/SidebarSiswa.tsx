"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Home, BookOpen, ClipboardCheck, GraduationCap, BarChart3, LogOut, Sparkles, School, EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth-action";
import { useTransition } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";

const MENU_SISWA = [
  {
    title: "Dashboard",
    url: "/dashboard-siswa",
    icon: Home,
  },
  {
    title: "Materi",
    url: "/dashboard-siswa/materi",
    icon: BookOpen,
  },
  {
    title: "Tugas",
    url: "/dashboard-siswa/tugas",
    icon: ClipboardCheck,
  },
  {
    title: "Kuis",
    url: "/dashboard-siswa/kuis",
    icon: GraduationCap,
  },
  {
    title: "Progres",
    url: "/dashboard-siswa/progres",
    icon: BarChart3,
  },
];

export default function SidebarSiswa() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = useTransition();
  const profile = useAuthStore((state) => state.profile);

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-gradient-b from-blue-50 to-indigo-50">
      {/* ================= HEADER ================= */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="font-semibold">
                <div className="bg-teal-500 flex p-2 items-center justify-center rounded-md">
                  <School className="size-4" />
                </div>
                E-LEARNINGKU
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ================= CONTENT ================= */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {MENU_SISWA.map((item) => {
                const active = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        href={item.url}
                        className={cn("px-4 py-3 h-auto", {
                          "bg-teal-500 text-white hover:bg-teal-500 hover:text-white": pathname === item.url,
                        })}
                      >
                        <item.icon className={cn("size-5", active ? "text-white" : "text-indigo-600")} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ================= FOOTER ================= */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    <AvatarFallback className="rounded-lg">{profile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <h4 className="truncate font-medium">{profile.name}</h4>
                    <p className="text-muted-foreground truncate text-xs capitalize">{profile.role}</p>
                  </div>
                  <EllipsisVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                      <AvatarFallback className="rounded-lg">{profile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <h4 className="truncate font-medium">{profile.name}</h4>
                      <p className="text-muted-foreground truncate text-xs capitalize">{profile.role}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
