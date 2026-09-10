"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import Link from "next/link";

import { createUserSchema } from "@/validations/auth-validation";
import { register } from "../actions";
import { INITIAL_STATE_CREATE_USER, ROLE_LIST } from "@/constants/auth-constant";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";

export default function RegisterForm() {
  const [state, formAction] = useActionState(register, INITIAL_STATE_CREATE_USER);

  const form = useForm({
    resolver: zodResolver(createUserSchema),
    // avatar_url dihapus dari defaultValues
    defaultValues: { name: "", email: "", password: "", role: "" },
  });

  return (
    <div className="flex flex-col justify-center w-full max-w-md mx-auto bg-white dark:bg-neutral-900 shadow-md rounded-xl p-6">
      <h1 className="text-2xl font-semibold text-center mb-4">Daftar Akun</h1>

      {state.status === "error" && state.errors?._form && <div className="text-sm text-destructive border border-destructive/50 rounded-md p-3 mb-3">{state.errors._form.join(", ")}</div>}

      <form action={formAction}>
        <FieldGroup className="space-y-4">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="space-y-2">
                <FieldLabel>Nama Lengkap</FieldLabel>
                <Input placeholder="Nama Anda" {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="space-y-2">
                <FieldLabel>Email</FieldLabel>
                <Input type="email" placeholder="email@example.com" {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="space-y-2">
                <FieldLabel>Password</FieldLabel>
                <Input type="password" placeholder="Minimal 6 karakter" {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <Field className="space-y-2">
                <FieldLabel>Peran</FieldLabel>
                <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Pilih peran</option>
                  <option value="User">User</option>
                </select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Button type="submit" className="w-full">
            Daftar
          </Button>
        </FieldGroup>
      </form>

      <p className="text-sm text-center text-muted-foreground mt-4">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Masuk sekarang
        </Link>
      </p>
    </div>
  );
}
