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

export const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be atleast 3 characters" }).trim(),
  price: z.coerce.number({ message: "Product price must be a number" }),
  description: z.string().optional(),
  InStock: z.coerce.boolean().optional()
});

export const updateSchema = z.object({
  name: z.string().min(3, { message: "Product name must be atleast 3 characters" }).optional(),
  price: z.coerce.number({ message: "Product price must be a number" }).optional(),
  description: z.string().optional(),
  InStock: z.coerce.boolean().optional()
});