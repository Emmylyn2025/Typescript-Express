import dotenv from "dotenv";
import { Response } from "express";
dotenv.config();
import jwt from "jsonwebtoken";
import { payLoadToken, tokenReturn, payLoadVerify, payLoadTokenSession } from "../types/userTypes";
import crypto from "crypto";


export function generateTokens(user: payLoadToken): tokenReturn {
  const accessSecret = process.env.accessToken;
  const refreshSecret = process.env.refreshToken;

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT are not defined in environmental variables");
  }

  const sessionId = crypto.randomBytes(16).toString('hex');


  const accessToken = jwt.sign({
    id: user?.id,
    username: user?.username,
    email: user?.email,
    role: user?.role,
    isEmailVer: user?.isEmailVer,
    sessionId
  }, accessSecret, { expiresIn: "30m" });

  const refreshToken = jwt.sign({
    id: user?.id,
    username: user?.username,
    email: user?.email,
    role: user?.role,
    isEmailVer: user?.isEmailVer,
    sessionId
  }, refreshSecret, { expiresIn: "30d" });

  return { accessToken, refreshToken };
}

export function verifyToken(user: payLoadVerify): string {
  const emailSecret = process.env.emailtoken;

  if (!emailSecret) {
    throw new Error("JWT are not defined in environmental variables");
  }

  const token = jwt.sign({
    id: user?.id,
    username: user?.username
  }, emailSecret, { expiresIn: "1d" });

  return token;
}

export function decodedEmailToken(token: string): payLoadVerify {

  const emailSecret = process.env.emailtoken;

  if (!emailSecret) {
    throw new Error("JWT are not defined in environmental variables");
  }

  return jwt.verify(token, emailSecret) as payLoadVerify;
}

//Verify accesstoken
export function verifyAccessToken(token: string): payLoadTokenSession {
  const accessSecret = process.env.accessToken;
  if (!accessSecret) {
    throw new Error("Access Token is not in env");
  }
  return jwt.verify(token, accessSecret) as payLoadTokenSession;
}

//Verify refresh Token
export function verifyRefreshToken(token: string): payLoadTokenSession {
  const refreshSecret = process.env.refreshToken;
  if (!refreshSecret) {
    throw new Error("Refresh Token is not in env");
  }
  return jwt.verify(token, refreshSecret) as payLoadTokenSession;
}

export function saveRefreshToken(res: Response, token: string) {
  res.cookie('refreshtoken', token, {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "none",
  });
}
