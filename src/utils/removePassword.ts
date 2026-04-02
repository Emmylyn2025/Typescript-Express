import { payLoadToken } from "../types/userTypes"

interface info extends payLoadToken {
  password: string
}

export const removePassword = (user: info) => {
  const { password, ...rest } = user;
  return rest;
}