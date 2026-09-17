import { Button } from "@/components/ui/button";
import { BookOpen, Gamepad2, GraduationCap, Pencil, Rocket, Trophy } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "E-Learning - Eduvance",
};

const features = [
  {
    title: "Materi Interaktif",
    description: "Belajar jadi lebih seru dengan animasi dan kuis yang menyenangkan.",
    icon: Gamepad2,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    title: "Tugas & Latihan",
    description: "Kerjakan PR dan latihan soal langsung dari gadgetmu dengan mudah.",
    icon: Pencil,
    color: "text-amber-500",
    bgColor: "bg-amber-100",
  },
  {
    title: "Pantau Prestasimu",
    description: "Kumpulkan poin dan dapatkan piala untuk setiap pelajaran yang diselesaikan!",
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
];

// --- COMPONENT LAYER ---
export default function EduvanceLandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* 1. HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-24 px-4 text-center overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob" />
          <div className="absolute top-10 right-10 w-32 h-32 bg-amber-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-wide">
          <Rocket className="size-4" />
          <span>Petualangan Belajar Dimulai!</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Cara Paling Seru Belajar & <span className="text-blue-600">Bikin Tugas SD!</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl">Eduvance adalah teman belajarmu. Pahami materi lebih cepat, selesaikan PR dengan mudah, dan jadilah juara di kelas.</p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          {/* Menggunakan struktur Link dan Button dari Shadcn UI seperti pada referensi awal */}
          <Link href="/dashboard-siswa">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all rounded-xl">
              <BookOpen className="mr-2 size-5" />
              Mulai Belajar
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-2 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl">
              Masuk Akun
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="py-20 px-4 md:px-8 bg-white border-t border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Kenapa Memilih Eduvance?</h2>
            <p className="mt-4 text-slate-500 text-lg">Didesain khusus untuk membuat anak SD semangat belajar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`p-4 rounded-2xl ${feature.bgColor} mb-6`}>
                    <Icon className={`size-10 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FOOTER SECTION */}
      <footer className="mt-auto py-8 text-center border-t border-slate-200 bg-slate-50 text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="size-6 text-slate-400" />
          <span className="text-lg font-bold text-slate-700">Eduvance</span>
        </div>
        <p>© {new Date().getFullYear()} Eduvance. Platform Belajar Hebat.</p>
      </footer>
    </main>
  );
}
