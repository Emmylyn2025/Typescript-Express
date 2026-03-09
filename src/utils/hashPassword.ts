import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function confirmPassword(password: string, savedPassword: string) {
  return await bcrypt.compare(password, savedPassword);
}