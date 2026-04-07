
export type Login = {
  email: string,
  password: string
}

export type User = Login & {
  username: string,
}

export type forget = {
  email: string
}

export interface payLoadVerify {
  id: string,
  username: string,
}

export interface payLoadToken extends payLoadVerify {
  email: string
  isEmailVer: boolean
  // sessionId: string
  role: 'USER' | 'ADMIN'
}

export interface payLoadTokenSession extends payLoadToken {
  sessionId: string
}

//For req.user
declare global {
  namespace Express {
    interface Request {
      user?: payLoadToken;
    }
  }
}

export type productTypes = {
  name: string,
  description?: string,
  price: number,
  InStock?: boolean
}

export interface tokenReturn {
  accessToken: string,
  refreshToken: string
}

export interface params {
  id: string
}

export interface reset {
  token: string,
}

export type productBody = {
  name?: string,
  price?: number,
  InStock?: boolean,
  description?: string
}

export type idParams = {
  id: string;
}

export interface update {
  username?: string,
  role?: 'USER' | 'ADMIN',
  orderId?: string,
  status?: 'PENDING' | 'DELIVERED' | 'CANCELLED'
}

export interface pass {
  newPassword: string
}

export type userQuery = {
  sort?: string,
  page?: number,
  limit?: number,
  fields?: string,
  [key: string]: any;
}