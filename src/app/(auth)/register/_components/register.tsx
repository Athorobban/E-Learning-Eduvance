// src/app/(auth)/register/page.tsx (atau komponen register.tsx Anda)
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, startTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createUserSchema } from "@/validations/auth-validation";
import { register } from "../actions"; // Sesuaikan path ini
import { INITIAL_STATE_CREATE_USER } from "@/constants/auth-constant";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, INITIAL_STATE_CREATE_USER);

  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "" },
  });

  // Fungsi interceptor agar react-hook-form melakukan validasi Zod terlebih dahulu
  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("role", data.role);

    // Kirim ke server action setelah lolos validasi
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <div className="flex flex-col justify-center w-full max-w-md mx-auto bg-white dark:bg-neutral-900 shadow-xl border border-slate-100 rounded-2xl p-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Daftar Akun</h1>
        <p className="text-sm text-slate-500 mt-2">Buat akun untuk mulai belajar.</p>
      </div>

      {state.status === "error" && state.errors?._form && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">{state.errors._form.join(", ")}</div>}

      {/* Menggunakan onSubmit dari react-hook-form, BUKAN action={formAction} secara langsung */}
      <form onSubmit={onSubmit}>
        <FieldGroup className="space-y-5">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="space-y-1.5">
                <FieldLabel className="font-semibold text-slate-700">Nama Lengkap</FieldLabel>
                <Input placeholder="Masukkan nama lengkap Anda" {...field} className={fieldState.error ? "border-red-500" : ""} />
                {/* PERBAIKAN: Hapus ?.message, cukup kirimkan fieldState.error */}
                <FieldError errors={[fieldState.error]} className="text-red-500 text-xs mt-1" />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="space-y-1.5">
                <FieldLabel className="font-semibold text-slate-700">Email</FieldLabel>
                <Input type="email" placeholder="email@contoh.com" {...field} className={fieldState.error ? "border-red-500" : ""} />
                {/* PERBAIKAN: Hapus ?.message */}
                <FieldError errors={[fieldState.error]} className="text-red-500 text-xs mt-1" />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="space-y-1.5">
                <FieldLabel className="font-semibold text-slate-700">Password</FieldLabel>
                <Input type="password" placeholder="Minimal 6 karakter" {...field} className={fieldState.error ? "border-red-500" : ""} />
                {/* PERBAIKAN: Hapus ?.message */}
                <FieldError errors={[fieldState.error]} className="text-red-500 text-xs mt-1" />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <Field className="space-y-1.5">
                <FieldLabel className="font-semibold text-slate-700">Peran Akun</FieldLabel>
                <select {...field} className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${fieldState.error ? "border-red-500" : "border-input"}`}>
                  <option value="" disabled>
                    -- Pilih Peran --
                  </option>
                  <option value="Guru">Guru</option>
                  <option value="Siswa">Siswa</option>
                </select>
                {/* PERBAIKAN: Hapus ?.message */}
                <FieldError errors={[fieldState.error]} className="text-red-500 text-xs mt-1" />
              </Field>
            )}
          />

          <Button type="submit" className="w-full mt-2" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Daftar Sekarang"
            )}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-sm text-center text-slate-500 mt-6">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
