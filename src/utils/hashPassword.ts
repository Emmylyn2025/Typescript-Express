import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function confirmPassword(password: string, savedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, savedPassword);
}