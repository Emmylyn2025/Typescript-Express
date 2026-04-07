import { payLoadVerify } from "../types/userTypes"

export interface info extends payLoadVerify {
  email: string
  isEmailVer: boolean
  password: string
  role: 'USER' | 'ADMIN'
}

export const removePassword = (user: info) => {
  const { password, ...rest } = user;
  return rest;
}