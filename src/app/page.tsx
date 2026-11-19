"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Gamepad2, GraduationCap, Pencil, Trophy, ArrowRight, Home, LogIn } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Materi Interaktif",
    description: "Belajar jadi lebih seru dengan animasi dan kuis yang menyenangkan.",
    icon: Gamepad2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Tugas & Latihan",
    description: "Kerjakan PR dan latihan soal langsung dari gadgetmu dengan mudah.",
    icon: Pencil,
    color: "text-slate-800",
    bgColor: "bg-slate-100",
  },
  {
    title: "Pantau Prestasimu",
    description: "Kumpulkan poin dan dapatkan piala untuk setiap pelajaran yang diselesaikan!",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
];

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function EduvanceLandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white font-sans pb-28 selection:bg-blue-100 selection:text-blue-900">
      <section className="relative flex flex-col items-center justify-center pt-24 md:pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-slate-50 text-slate-800 text-sm font-bold border border-slate-200 shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            Platform Belajar Masa Kini
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.1]">Cara Paling Seru Belajar & Bikin Tugas SD.</h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-8 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">Eduvance adalah teman belajarmu. Pahami materi lebih cepat, selesaikan PR dengan mudah, dan jadilah juara di kelas.</p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard-siswa">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all">
                Mulai Belajar <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-900 rounded-full transition-all">
                Masuk Akun
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Kenapa Memilih Eduvance?</h2>
              <p className="mt-4 text-slate-600 text-lg font-medium">Didesain khusus untuk membuat anak SD semangat belajar.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={index} delay={index * 150}>
                  <div className="flex flex-col items-start p-8 rounded-3xl bg-white border-2 border-slate-100 hover:border-slate-300 hover:shadow-xl transition-all duration-300 group">
                    <div className={`p-4 rounded-2xl ${feature.bgColor} mb-6 transition-transform duration-300 group-hover:-translate-y-2`}>
                      <Icon className={`size-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">{feature.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mt-auto py-12 text-center border-t border-slate-100 bg-white text-slate-500">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="size-8 text-slate-900" />
            <span className="text-xl font-black text-slate-900 tracking-tight">Eduvance.</span>
          </div>
          <p className="font-medium">© {new Date().getFullYear()} Hak Cipta Dilindungi.</p>
        </ScrollReveal>
      </footer>

      <nav className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-max max-w-md px-6 py-3.5 bg-white/70 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-full flex items-center justify-between sm:justify-center sm:gap-12 transition-all">
        <Link href="/" className="flex flex-col items-center gap-1 text-blue-600 transition-colors">
          <Home className="size-5 sm:size-6" />
          <span className="text-[10px] sm:text-xs font-bold">Beranda</span>
        </Link>
        <Link href="/dashboard-siswa/materi" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <BookOpen className="size-5 sm:size-6" />
          <span className="text-[10px] sm:text-xs font-bold">Materi</span>
        </Link>
        <Link href="/dashboard-siswa/tugas" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <Pencil className="size-5 sm:size-6" />
          <span className="text-[10px] sm:text-xs font-bold">Tugas</span>
        </Link>
        <Link href="/login" className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
          <LogIn className="size-5 sm:size-6" />
          <span className="text-[10px] sm:text-xs font-bold">Masuk</span>
        </Link>
      </nav>
    </main>
  );
}
