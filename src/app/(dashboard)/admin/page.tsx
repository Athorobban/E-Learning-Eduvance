import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, ClipboardList, FileQuestion, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Eduvance | Dashboard",
};

// Ambil role user login
async function getUserRole() {
  const supabase = await createClient();
  const cookiesStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  return profile?.role ?? null;
}

async function getDashboardData() {
  const supabase = await createClient();
  const cookiesStore = await cookies();

  const { count: totalSiswa } = await supabase.from("profiles").select("*", { head: true, count: "exact" }).eq("role", "Siswa");

  const { count: totalGuru } = await supabase.from("profiles").select("*", { head: true, count: "exact" }).eq("role", "Guru");

  const { count: totalMateri } = await supabase.from("materi").select("*", { head: true, count: "exact" });

  const { count: totalTugas } = await supabase.from("tugas").select("*", { head: true, count: "exact" });

  const { count: totalKuis } = await supabase.from("quizzes").select("*", { head: true, count: "exact" });

  const { data: materiLatest } = await supabase.from("materi").select("id, judul, created_at").order("created_at", { ascending: false }).limit(3);

  const { data: tugasLatest } = await supabase.from("tugas").select("id, judul, created_at").order("created_at", { ascending: false }).limit(3);

  const { data: quizLatest } = await supabase.from("quizzes").select("id, title, created_at").order("created_at", { ascending: false }).limit(3);

  const aktivitasGabung = [
    ...(materiLatest?.map((m) => ({
      title: `Materi baru: ${m.judul}`,
      created_at: m.created_at,
      type: "materi",
    })) ?? []),

    ...(tugasLatest?.map((t) => ({
      title: `Tugas baru: ${t.judul}`,
      created_at: t.created_at,
      type: "tugas",
    })) ?? []),

    ...(quizLatest?.map((q) => ({
      title: `Kuis baru: ${q.title}`,
      created_at: q.created_at,
      type: "kuis",
    })) ?? []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return {
    totalSiswa,
    totalGuru,
    totalMateri,
    totalTugas,
    totalKuis,
    aktivitasGabung,
  };
}

function StatsCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold mt-1">{value}</h2>
        </div>
        <div className={`p-3 rounded-xl text-white ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

function ActivityTimeline({ items }: { items: any[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary"></div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("id-ID")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const role = await getUserRole();
  const { totalSiswa, totalGuru, totalMateri, totalTugas, totalKuis, aktivitasGabung } = await getDashboardData();

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin/Guru</h1>
        <p className="text-muted-foreground mt-1">Ringkasan aktivitas dan data pembelajaran.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {/* === Hanya Admin yang bisa melihat Siswa & Guru === */}
        {role === "Admin" && (
          <>
            <StatsCard title="Siswa" value={totalSiswa ?? 0} icon={Users} color="bg-indigo-500" />

            <StatsCard title="Guru" value={totalGuru ?? 0} icon={Users} color="bg-purple-500" />
          </>
        )}

        {/* === Semua role (Admin/Guru) bisa lihat Materi, Tugas, Kuis === */}
        <StatsCard title="Materi" value={totalMateri ?? 0} icon={BookOpen} color="bg-blue-500" />

        <StatsCard title="Tugas" value={totalTugas ?? 0} icon={ClipboardList} color="bg-green-500" />

        <StatsCard title="Kuis" value={totalKuis ?? 0} icon={FileQuestion} color="bg-orange-500" />
      </div>

      {/* QUICK ACTIONS */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Tambah Materi", href: "/admin/materi" },
              { label: "Tambah Tugas", href: "/admin/tugas" },
              { label: "Buat Kuis", href: "/admin/quiz" },
            ].map((btn, i) => (
              <a key={i} href={btn.href} className="flex items-center justify-between px-4 py-3 rounded-lg border hover:bg-accent transition">
                <span className="font-medium text-sm">{btn.label}</span>
                <ArrowUpRight size={18} />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AKTIVITAS TERBARU */}
      <ActivityTimeline items={aktivitasGabung} />
    </div>
  );
}
