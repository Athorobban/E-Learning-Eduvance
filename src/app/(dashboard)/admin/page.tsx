import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, ClipboardList, FileQuestion, PlusCircle, FileText, Clock, BookPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export const metadata = {
  title: "Eduvance | Dashboard",
};

// --- TYPES & INTERFACES ---
interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  bgLightClass: string;
}

interface ActivityItem {
  title: string;
  created_at: string;
  type: "materi" | "tugas" | "kuis";
}

// --- DATA FETCHING ---
// Ganti fungsi getUserRole sebelumnya dengan ini:
async function getUserProfile(): Promise<{ role: string | null; name: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { role: null, name: null };

  // Tambahkan "name" ke dalam string select()
  const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", user.id).single();

  return {
    role: profile?.role ?? null,
    name: profile?.name ?? null,
  };
}

async function getDashboardData() {
  const supabase = await createClient();

  // BEST PRACTICE: Gunakan Promise.all untuk eksekusi query paralel.
  // Ini akan memangkas waktu loading halaman dari ~800ms menjadi ~150ms!
  const [{ count: totalSiswa }, { count: totalGuru }, { count: totalMateri }, { count: totalTugas }, { count: totalKuis }, { data: materiLatest }, { data: tugasLatest }, { data: quizLatest }] = await Promise.all([
    supabase.from("profiles").select("*", { head: true, count: "exact" }).eq("role", "Siswa"),
    supabase.from("profiles").select("*", { head: true, count: "exact" }).eq("role", "Guru"),
    supabase.from("materi").select("*", { head: true, count: "exact" }),
    supabase.from("tugas").select("*", { head: true, count: "exact" }),
    supabase.from("quizzes").select("*", { head: true, count: "exact" }),
    supabase.from("materi").select("id, judul, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("tugas").select("id, judul, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("quizzes").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
  ]);

  const aktivitasGabung: ActivityItem[] = [
    ...(materiLatest?.map((m) => ({ title: `Materi ditambahkan: ${m.judul}`, created_at: m.created_at, type: "materi" as const })) ?? []),
    ...(tugasLatest?.map((t) => ({ title: `Tugas dibagikan: ${t.judul}`, created_at: t.created_at, type: "tugas" as const })) ?? []),
    ...(quizLatest?.map((q) => ({ title: `Kuis dibuat: ${q.title}`, created_at: q.created_at, type: "kuis" as const })) ?? []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5); // Ambil 5 terbaru agar UI tidak terlalu panjang ke bawah

  return { totalSiswa, totalGuru, totalMateri, totalTugas, totalKuis, aktivitasGabung };
}

// --- UI COMPONENTS ---
function StatsCard({ title, value, icon: Icon, colorClass, bgLightClass }: StatsCardProps) {
  return (
    <Card className="p-5 border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${bgLightClass} ${colorClass}`}>
          <Icon size={26} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-0.5">{value}</h2>
        </div>
      </div>
    </Card>
  );
}

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="shadow-sm border-slate-100 h-full">
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-blue-600" />
          <CardTitle className="text-lg font-bold text-slate-800">Riwayat Aktivitas Terkini</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Clock size={40} className="mb-3 opacity-20" />
            <p>Belum ada riwayat aktivitas.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-lin-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {items.map((item, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Marker Garis Waktu */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow" />

                {/* Konten */}
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-medium text-sm">{item.title}</span>
                    <span className="text-slate-400 text-xs mt-1 font-medium">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- MAIN PAGE ---
export default async function AdminDashboard() {
  const { role, name } = await getUserProfile();
  const { totalSiswa, totalGuru, totalMateri, totalTugas, totalKuis, aktivitasGabung } = await getDashboardData();
  const greetingName = name || (role === "Admin" ? "Admin" : "Bapak/Ibu Guru");

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Halo, {greetingName} 👋</h1>
        <p className="text-slate-500 text-base md:text-lg">Pantau perkembangan kelas dan kelola materi pembelajaran dengan mudah hari ini.</p>
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {role === "Admin" && (
          <>
            <StatsCard title="Total Siswa" value={totalSiswa ?? 0} icon={Users} colorClass="text-indigo-600" bgLightClass="bg-indigo-100" />
            <StatsCard title="Total Guru" value={totalGuru ?? 0} icon={Users} colorClass="text-purple-600" bgLightClass="bg-purple-100" />
          </>
        )}
        <StatsCard title="Materi Belajar" value={totalMateri ?? 0} icon={BookOpen} colorClass="text-blue-600" bgLightClass="bg-blue-100" />
        <StatsCard title="Tugas Aktif" value={totalTugas ?? 0} icon={ClipboardList} colorClass="text-emerald-600" bgLightClass="bg-emerald-100" />
        <StatsCard title="Kuis Siswa" value={totalKuis ?? 0} icon={FileQuestion} colorClass="text-amber-600" bgLightClass="bg-amber-100" />
      </div>

      {/* TWO COLUMN LAYOUT UNTUK DEKSTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: AKSI CEPAT */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-100 border-t-4 border-t-blue-500">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Menu Akses Cepat</CardTitle>
              <p className="text-sm text-slate-500">Pilih tindakan yang ingin Anda lakukan.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Tambah Materi Baru", desc: "Buat bahan bacaan siswa", href: "/admin/materi", icon: BookPlus, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Berikan Tugas", desc: "Buat tugas & kumpulkan nilai", href: "/admin/tugas", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Rancang Kuis", desc: "Uji pemahaman siswa", href: "/admin/quiz", icon: PlusCircle, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((btn, i) => (
                  <Link key={i} href={btn.href} className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className={`p-3 rounded-lg ${btn.bg} ${btn.color} group-hover:scale-110 transition-transform`}>
                      <btn.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{btn.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{btn.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: AKTIVITAS */}
        <div className="lg:col-span-2">
          <ActivityTimeline items={aktivitasGabung} />
        </div>
      </div>
    </div>
  );
}
