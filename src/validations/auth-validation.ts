import z from "zod";

export const loginSchemaForm = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Masukkan format email yang benar"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.string().min(1, "Role is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
});

export type LoginForm = z.infer<typeof loginSchemaForm>;
export type CreateUserForm = z.infer<typeof createUserSchema>;
export type UpdateUserForm = z.infer<typeof updateUserSchema>;
