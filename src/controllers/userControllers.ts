import { Request, Response, NextFunction } from "express";
//import { Prisma } from "@prisma/client";
import { handlePrismaError } from "../utils/handleErrorPrisma";
import prisma from "../prisma/prismaClient";
import { hashPassword, confirmPassword } from "../utils/hashPassword";
import { User, Login, forget, userQuery, params, update, reset, pass } from "../types/userTypes";
import redisClient from "../redis/redis";
import { generateTokens, saveRefreshToken, verifyRefreshToken, verifyToken, decodedEmailToken } from "../utils/token";
import { asyncHandler, appError } from "../utils/appError";
import QueryBuilder from "../utils/queryBuilder";
import { validate as isUUID } from "uuid";
import crypto from "crypto";
import { sendEmail } from "../utils/email";

export const RegisterUsers = asyncHandler(async (req: Request<{}, {}, User>, res: Response, next: NextFunction) => {
  const { username, email, password, age } = req.body;

  //Check if user exists before
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  });

  if (user) {
    return next(new appError("This is a registered user", 409));
  }

  //Hash the user password
  const hash = await hashPassword(password);

  //create user
  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      age,
      password: hash
    }
  });

  //generate email verification token
  const token = verifyToken(newUser);

  const verifyUrl = `http://localhost:${process.env.PORT}/typescript/verify-email?token=${token}`;

  await sendEmail(
    newUser.email,
    "Email verification after registration",
    `
    <p>
      Click the link below to verify you email <br>
      <a href=${verifyUrl}>This link</a><br>
      <p>Hence this link is only valid for 24 hours</p>
    </p>
    `,
  )

  res.status(201).json({
    status: 'success',
    message: "USer registered successfully",
    member: {
      id: newUser.id,
      email: newUser.email,
      emailVerified: newUser.isEmailVer
    }
  });

});

export const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string | undefined;

  if (!token) return next(new appError("Verification token is missing", 400));

  const verify = decodedEmailToken(token);

  const user = await prisma.user.findUnique({
    where: {
      id: verify.id
    }
  });

  if (!user) return next(new appError("User not found", 404));

  //Update user email verification
  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      isEmailVer: true
    }
  });

  res.json({
    message: "Email verified successfully"
  })
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

  if (user.isEmailVer === false) return next(new appError("You haven't verified your email", 400));

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
  const refreshCookie = req.cookies?.refreshtoken as string | undefined;
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
  await redisClient.set(`user:${user.id}`, refreshToken, { EX: 2592000 });

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
  const allowedFields = ['username', 'email', 'createdAt', 'age', 'role', 'id', "isEmailVer"];

  const builder = new QueryBuilder(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();

  try {
    const users = await prisma.user.findMany(builder.query);

    res.status(200).json({
      status: 'success',
      data: users,
      length: users.length
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
})

export const forgotpassword = asyncHandler(async (req: Request<{}, {}, forget>, res: Response, next: NextFunction) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) return next(new appError("User not found", 404));


  //Generate random token
  const randomToken = await crypto.randomBytes(32).toString('base64');

  const url = `http://localhost:3000/typescript/reset-password/${randomToken}`;
  console.log(url);

  //Save hased bytes in redis
  await redisClient.set(`userReset:${randomToken}`, user.id, { EX: 600 });

  res.status(200).json({
    message: "Sent to your gmail successfully"
  })

});

export const resetPassword = asyncHandler(async (req: Request<reset, {}, pass>, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  //Get user from redis
  const userId = await redisClient.get(`userReset:${token}`);
  if (!userId) return next(new appError("Invalid or expired token", 401));

  const hashedPassword = await hashPassword(newPassword);

  try {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        password: hashedPassword
      }
    })

    res.status(200).json({
      message: "Password reset successfully"
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});

export const deleteUser = asyncHandler(async (req: Request<params>, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!isUUID(id)) return next(new appError("Invalid id format", 400));

  try {

    const user = await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        role: true
      }
    });


    res.status(200).json({
      message: "User deleted successfully",
      user
    });

  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});

export const updateUser = asyncHandler(async (req: Request<params, {}, update>, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!isUUID(id)) return next(new appError("Invalid id format", 400));
  let { username, age, role } = req.body;

  try {

    const user = await prisma.user.update({
      where: { id },
      data: {
        username,
        age,
        role
      },
      select: {
        username: true,
        age: true,
        role: true
      }
    });

    res.status(200).json({
      user,
      message: 'User updated successfully'
    });

  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});