import z from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be minimum of 3 characters" }).trim(),
  email: z.email({ message: "Invalid email format" }).trim().toLowerCase(),
  password: z.string().min(8, { message: "Username must be minimum of 8 characters" }).trim(),
  age: z.number({
    message: "Age must be a number"
  })
});

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email format" }).trim().toLowerCase(),
  password: z.string().min(8, { message: "Username must be minimum of 8 characters" }).trim(),
});

export const forgotSchema = z.object({
  email: z.email({ message: "Invalid email format" }).trim().toLowerCase()
});