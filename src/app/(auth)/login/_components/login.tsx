"use client";

import FormInput from "@/components/common/form-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { INITIAL_LOGIN_FORM, INITIAL_STATE_LOGIN_FORM } from "@/constants/auth-constant";
import { LoginForm, loginSchemaForm } from "@/validations/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { login } from "../actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function Login() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchemaForm),
    defaultValues: INITIAL_LOGIN_FORM,
  });

  const [loginState, loginAction, isPendingLogin] = useActionState(login, INITIAL_STATE_LOGIN_FORM);

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(() => {
      loginAction(formData);
    });
  });

  useEffect(() => {
    if (loginState?.status === "error") {
      toast.error("Login Failed", {
        description: loginState.errors?._form?.[0],
      });
      startTransition(() => {
        loginAction(null);
      });
    }
  }, [loginState]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome</CardTitle>
        <CardDescription>Login to access all features</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup className="space-y-4">
            <FormInput form={form} name="email" label="Email" placeholder="Insert email here" type="email" />
            <FormInput form={form} name="password" label="Password" placeholder="******" type="password" />
            <Button type="submit" className="w-full">
              {isPendingLogin ? <Loader2 className="animate-spin" /> : "Login"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <p className="text-sm text-center text-muted-foreground mt-4">
        Belum punya akun?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Buat Akun Sekarang
        </Link>
      </p>
    </Card>
  );
}
