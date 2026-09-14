import SidebarSiswa from "./_components/SidebarSiswa";
import HeaderSiswa from "./_components/HeaderSiswa";
import ChatWidget from "./_components/ChatWidget";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import DashboardBreadcrumb from "../(dashboard)/_components/dashboard-breadcrumb";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarSiswa />
      <SidebarInset className="overflow-x-hidden">
        <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <DashboardBreadcrumb />
          </div>
          <div className="px-4"></div>
        </header>
        <main className="flex flex-1 flex-col items-start gap-4 p-4 pt-0">{children}</main>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}
