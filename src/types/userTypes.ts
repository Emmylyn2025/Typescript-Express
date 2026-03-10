export type User = {
  username: string,
  email: string,
  password: string,
  age: number
}

export type Login = {
  email: string,
  password: string
}

export type forget = {
  email: string
}

export interface payLoadToken {
  id: string,
  username: string,
  age: number
}

export interface tokenReturn {
  accessToken: string,
  refreshToken: string
}

export type userQuery = {
  sort?: string,
  page?: number,
  limit?: number,
  fields?: string,
  [key: string]: any;
}