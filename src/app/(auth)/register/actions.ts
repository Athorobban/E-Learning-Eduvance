"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createUserSchema } from "@/validations/auth-validation";
import { INITIAL_STATE_CREATE_USER } from "@/constants/auth-constant";
import { AuthFormState } from "@/types/auth";

export async function register(prevState: AuthFormState, formData: FormData | null) {
  if (!formData) return INITIAL_STATE_CREATE_USER;

  const validatedFields = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "User",
    avatar_url: "",
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: [],
      },
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    options: {
      data: {
        name: validatedFields.data.name,
        role: validatedFields.data.role,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  revalidatePath("/", "layout");
  redirect("/login?registered=1");
}
