import { Request, Response, NextFunction } from "express"
import prisma from "../prisma/prismaClient";
import { hashPassword, confirmPassword } from "../utils/hashPassword";
import { User, Login, forget, userQuery } from "../types/userTypes";
import redisClient from "../redis/redis";
import { generateTokens, saveRefreshToken, verifyRefreshToken } from "../utils/token";
import { asyncHandler, appError } from "../utils/appError";

export const RegisterUsers = asyncHandler(async (req: Request<{}, {}, User>, res: Response, next: NextFunction) => {
  const { username, email, password, age } = req.body;

  //Check if user exists before
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  });

  if (user) {
    return next(new appError("This is a registered user", 400));
  }

  //Hash the user password
  const hash = await hashPassword(password);

  //create user
  await prisma.user.create({
    data: {
      username,
      email,
      age,
      password: hash
    }
  });

  res.status(200).json({
    status: 'success',
    message: "USer registered successfully"
  });

})

export const LoginUsers = asyncHandler(async (req: Request<{}, {}, Login>, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  //Check if email exists
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  });

  if (!user) {
    return next(new appError("Invalid email", 401));
  }

  //Compare user password
  const confirm = await confirmPassword(password, user.password);

  if (!confirm) {
    return next(new appError("Invalid password", 401));
  }

  //If password is valid
  const { accessToken, refreshToken } = generateTokens(user);

  //Save refresh token in redis
  await redisClient.set(`user:${user.id}`, refreshToken, { EX: 2592000 });

  //Save refresh token in httpOnly cookie
  saveRefreshToken(res, refreshToken);

  res.status(200).json({
    message: "Login Successful",
    token: accessToken
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const refreshCookie = req.cookies.refreshtoken;
  if (!refreshCookie) return next(new appError("No refresh token available in cookie", 401));
  const user = verifyRefreshToken(refreshCookie);

  //Check if it is valid in redis
  const redis = await redisClient.get(`user:${user.id}`);

  if (!redis) return next(new appError("Invalid refresh token or Expired refresh token", 401));
  if (refreshCookie !== redis) {
    return next(new appError("Invalid refresh token", 401))
  }

  //Assign new tokens
  const { accessToken, refreshToken } = generateTokens(user);

  //Save refresh token in redis
  await redisClient.set(`user:${user.id}`, refreshToken);

  //Save refresh token inside cookie
  saveRefreshToken(res, refreshToken);

  res.status(200).json({
    token: accessToken
  });
});

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const refreshCookie = req.cookies.refreshtoken;
  if (!refreshCookie) return next(new appError("No refresh token available in cookie", 401));
  const user = verifyRefreshToken(refreshCookie);

  //Check if it is valid in redis
  const redis = await redisClient.get(`user:${user.id}`);

  if (!redis) return next(new appError("Invalid refresh token or Expired refresh token", 401));

  //Delete from redis
  await redisClient.del(`user:${user.id}`);

  //Remove from cookie
  res.clearCookie('refreshtoken');

  res.status(200).json({
    status: "Successful",
    message: "Logout successfully"
  });
});

export const allUsers = asyncHandler(async (req: Request<{}, {}, {}, userQuery>, res: Response, next: NextFunction) => {
  let { page, sort, limit, fields, ...names } = req.query;
  //Get users from redis
  const redisUsers = await redisClient.get('users');

  const redis = JSON.parse(redisUsers as string)

  if (redis) {
    return res.status(200).json({
      status: 'success',
      data: redis,
      length: redis.length
    })
  }
  let str = JSON.stringify(names);

  str = str.replace(
    /\b(gte|gt|lte|lt)\b/g,
    match => `$${match}`
  );

  const parsed = JSON.parse(str);

  const allowedFilters = ['username', 'email', 'createdAt', 'age', 'role', 'id'];
  Object.keys(parsed).forEach((key) => {
    if (!allowedFilters.includes(key)) return next(new appError("Invalid key to filter by", 400));
  })

  let where: any = {};

  for (const key in parsed) {
    if (typeof parsed[key] === "object") {

      where[key] = {};

      for (const operator in parsed[key]) {
        const op = operator.replace("$", "");
        where[key][op] = Number(parsed[key][operator])
      }
    } else {
      where[key] = parsed[key];
    }
  }

  let orderBy: any = [];

  if (sort) {
    const sortFields = (sort as string).split(",");

    const allowedOrder = ['username', 'email', 'createdAt', 'age'];

    sortFields.forEach((field) => {
      if (!allowedOrder.includes(field)) return next(new appError("Invalid field to order by", 400))
    })

    orderBy = sortFields.map(field => {

      if (field.startsWith("-")) {
        return { [field.substring(1)]: "desc" };
      }

      return { [field]: "asc" };
    })
  }

  let select: any = {};

  if (fields) {
    const fieldList = (fields as string).split(",");

    fieldList.forEach((f) => {
      if (f !== "password") select[f] = true;
    });
  } else {
    select = {
      id: true,
      username: true,
      email: true,
      age: true,
      createdAt: true,
      role: true
    };
  }

  page = Number(page) || 1;
  limit = Number(limit) || 5;

  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    where,
    orderBy,
    select,
    skip,
    take: limit
  });

  if (!users) return next(new appError("User not found", 404));

  const stringUsers = JSON.stringify(users);
  //Save in redis
  await redisClient.set('users', stringUsers, { EX: 60 * 30 });

  res.status(200).json({
    status: 'success',
    data: users,
    length: users.length
  });
})

export const forgotpassword = asyncHandler(async (req: Request<{}, {}, forget>, res: Response, next: NextFunction) => {
  const { email } = req.body;

  //Check if user exists
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) return next(new appError("User not found", 404));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

})