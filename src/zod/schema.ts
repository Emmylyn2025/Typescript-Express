import z from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).trim(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).trim(),
  age: z.number()
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).trim(),
});