"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { EllipsisVertical, LogOut, School, UserCircle } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { SIDEBAR_MENU_LIST, SidebarMenuKey } from "@/constants/sidebar-constant";
import { cn } from "@/lib/utils";
// Pastikan getProfileFromCookie di-import!
import { signOut, getProfileFromCookie } from "@/actions/auth-action";
import { useAuthStore } from "@/stores/auth-store";

export function AppSidebar() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => (state as any).setProfile);

  const [isLoading, setIsLoading] = useState(true);

  // HYDRATION: Menarik data dari server cookie ke client store saat pertama kali dimuat
  useEffect(() => {
    const hydrateProfile = async () => {
      // Jika di store belum ada role, minta dari server
      if (!profile?.role) {
        try {
          const serverProfile = await getProfileFromCookie();
          if (serverProfile && setProfile) {
            setProfile(serverProfile);
          }
        } catch (error) {
          console.error("Gagal memuat profil:", error);
        }
      }
      setIsLoading(false);
    };

    hydrateProfile();
  }, [profile?.role, setProfile]);

  // Fallback variabel agar tidak error saat map berjalan
  const userName = profile?.name || "Pengguna";
  const userRole = profile?.role || "Memuat...";

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="gap-2 flex-row items-center mt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <School className="text-primary size-6 mr-1" />
                <span className="font-extrabold text-2xl text-slate-800 tracking-tight">
                  Edu<span className="text-primary">vance</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-4">
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {/* Tambahkan pengecekan isLoading agar UI tidak berkedip kosong */}
              {!isLoading &&
                SIDEBAR_MENU_LIST[profile?.role as SidebarMenuKey]?.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={cn(
                          "py-6 px-5 text-md transition-all duration-200",
                          pathname === item.url ? "bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        <Link href={item.url}>
                          {Icon && <Icon className="size-5" />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mb-2">
                  <UserCircle className="size-8 text-primary" />
                  <div className="leading-tight ml-2 text-left flex-1">
                    <h4 className="truncate font-medium text-slate-800">{userName}</h4>
                    <p className="text-muted-foreground truncate text-xs capitalize">{userRole}</p>
                  </div>
                  <EllipsisVertical className="ml-auto size-4 text-slate-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="min-w-56 rounded-xl shadow-lg border-slate-100" side={isMobile ? "bottom" : "right"} align="end" sideOffset={12}>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-t-lg">
                    <UserCircle className="size-9 text-primary/80" />
                    <div className="leading-tight">
                      <h4 className="truncate font-semibold text-slate-800">{userName}</h4>
                      <p className="text-muted-foreground truncate text-xs capitalize">{userRole}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer py-2.5 rounded-md mt-1 transition-colors">
                    <LogOut className="mr-2 size-4" />
                    <span className="font-medium">Logout</span>
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
