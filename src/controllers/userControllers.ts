import { Request, Response, NextFunction } from "express";
//import { Prisma } from "@prisma/client";
import { handlePrismaError } from "../utils/handleErrorPrisma";
import prisma from "../prisma/prismaClient";
import { hashPassword, confirmPassword } from "../utils/hashPassword";
import { User, Login, forget, userQuery, params, update, reset, pass, payLoadToken } from "../types/userTypes";
import redisClient from "../redis/redis";
import { generateTokens, saveRefreshToken, verifyRefreshToken, verifyToken, decodedEmailToken, verifyAccessToken } from "../utils/token";
import { asyncHandler, appError } from "../utils/appError";
import QueryBuilder from "../utils/queryBuilder";
import { validate as isUUID } from "uuid";
import crypto from "crypto";
import { sendEmail } from "../email/templates";
import { googleClient } from "../utils/google";
import { removePassword } from "../utils/removePassword";
import { info } from "../utils/removePassword";
import { sendResetPass } from "../email/templates";
import jwt from "jsonwebtoken"


export let verifyUrl: string

export const RegisterUsers = asyncHandler(async (req: Request<{}, {}, User>, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;

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
      password: hash
    }
  });

  //generate email verification token
  const token = verifyToken(newUser);

  verifyUrl = `https://api.emmanuelawobodu.com/typescript/verify-email?token=${token}`;

  await sendEmail(
    newUser.email,
    verifyUrl
  );

  await redisClient.set(`registerToken${newUser.id}`, token, { EX: 3600 * 24 });

  res.status(201).json({
    status: 'success',
    message: "USer registered successfully, Make sure you verify your email",
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

  //Check if the token has expired in redis
  const userToken = await redisClient.get(`registerToken${user.id}`);

  if (!userToken) return next(new appError("The email verification token has been expired", 400));

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
    message: "Email verification complete, You can now login"
  })
});

export const LoginUsers = asyncHandler(async (req: Request<{}, {}, Login>, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  //Check if email exists
  const user = await prisma.user.findUnique({
    where: {
      email: email
    },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
      isEmailVer: true
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

  const removedPassword = removePassword(user);

  //If password is valid
  const { accessToken, refreshToken } = generateTokens(removedPassword as info);

  //Save refresh token in redis
  await redisClient.set(`user:${user.id}`, refreshToken, { EX: 2592000 });

  //store accesstoken in redis for cookie expiration
  await redisClient.set(`access${user.id}`, accessToken, { EX: 1800 });

  //Save refresh token in httpOnly cookie
  saveRefreshToken(res, refreshToken);

  //Save access token inside of httpOnly cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // true in production
    sameSite: "none",
    maxAge: 30 * 60 * 1000
  });

  res.status(200).json({
    message: "Login Successful",
    token: accessToken,
    user: removedPassword
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

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // true in production
    sameSite: "lax",
    maxAge: 30 * 60 * 1000
  });

  res.status(200).json({
    token: accessToken
  });
});

export const StayLogged = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken as string;
  console.log(accessToken);
  if (!accessToken) return next(new appError("No accessToken in cookie", 401))
  
  try {
    const user = jwt.verify(accessToken, process.env.accessToken!);

  res.status(200).json({
    data: user
  });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new appError("jwt expired", 401));
    }

    return next(new appError("internal server error", 500))
  }
})

export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const refreshCookie = req.cookies.refreshtoken;
  if (!refreshCookie) return next(new appError("No refresh token available in cookie", 401));
  const user = verifyRefreshToken(refreshCookie);

  //Get access token fom cookie
  const accessToken = req.cookies?.accessToken;
  if (accessToken) {

  try {

    const user2 = verifyAccessToken(accessToken);

    if (user !== user2) {
      return next(new appError("Invalid access token", 400));
    }
    
  //Check if it is valid in redis
  const redis = await redisClient.get(`user:${user.id}`);
  const access = await redisClient.get(`access${user.id}`);

  //save the access token as blacklist
  await redisClient.set(`blacklist${access}`, "true", { EX: 3600 });

  if (!redis) return next(new appError("Invalid refresh token or Expired refresh token", 401));

  //Delete from redis
  await redisClient.del(`user:${user.id}`);

  //Remove from cookie
  res.clearCookie('refreshtoken');
  res.clearCookie('accessToken');

  res.status(200).json({
    status: "Successful",
    message: "Logout successfully"
  });
    
    
  } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
      return next(new appError("jwt expired", 401));
     }

    return next(new appError("internal server error", 500))
    }
  }
  
  //}
});

export const allUsers = asyncHandler(async (req: Request<{}, {}, {}, userQuery>, res: Response, next: NextFunction) => {
  const allowedFields = ['username', 'email', 'createdAt', 'role', 'id', "isEmailVer"];

  const builder = new QueryBuilder(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();

  try {
    const users = await prisma.user.findMany({
      ...builder.query,
      select: {
        ...(builder.query.select || {}),
        products: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        carts: {
          select: {
            id: true
          }
        },
        orders: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            total: true,
            orderItems: {
              select: {
                quantity: true,
                price: true,
                productId: true,
                product: {
                  select: {
                    productImageUrl: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: users,
      length: users.length
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
    console.log(error);
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

  //Save hased bytes in redis
  await redisClient.set(`userReset:${randomToken}`, user.id, { EX: 60 * 10 });

  const url = `https://api.emmanuelawobodu.com/typescript/reset-password?token=${randomToken}`;

  //Send the url link to the user email
  await sendResetPass(
    user.email,
    url,
  )

  res.status(200).json({
    message: "Sent to your gmail successfully"
  })

});

export const resetPassword = asyncHandler(async (req: Request<{}, {}, pass, reset>, res: Response, next: NextFunction) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  //Get user from redis
  const userId = await redisClient.get(`userReset:${token}`);
  //console.log(userId);
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
  let { username, role, orderId, status } = req.body;

  try {

    const user = await prisma.user.update({
      where: { id },
      data: {
        username,
        role,
        orders: {
          update: {
            where: {
              id: orderId
            },
            data: {
              status
            }
          }
        }
      },
      select: {
        username: true,
        role: true,
        orders: {
          select: {
            status: true
          }
        }
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

export const googleAuthStart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const client = googleClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"]
  });

  //console.log(url);

  return res.redirect(url);
});

export const getAuthCallBackHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return next(new appError("Missing code in callback", 400));
  }

  const client = googleClient();

  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) return next(new appError("Google id token is not present", 400));

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID as string
  });

  const payload = ticket.payload;
  const email = payload?.email;
  const emailVerified = payload?.email_verified

  if (!email || emailVerified !== true) return next(new appError("This email is not verified by google", 400));

  const normalizedEmail = email.toLowerCase().trim();

  let user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (user && user.isEmailVer === false) {
    await prisma.user.update({
      where: {
        id: user?.id
      },
      data: {
        isEmailVer: true
      }
    })
  }

  if (!user) {
    //Create a new user if the user does not exists
    const randomPassword = await crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);

    //Make google create a new user
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: 'USER',
        username: payload?.given_name,
        isEmailVer: true
      }
    })

  }

  const { accessToken, refreshToken } = generateTokens(user);

  //save refresh token in redis
  await redisClient.set(`user:${user.id}`, refreshToken, { EX: 2592000 });

  //Save refresh token in httpOnly cookie
  saveRefreshToken(res, refreshToken);

  //Save access token in httpOnly cookie too
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true, // true in production
    sameSite: "none",
    maxAge: 30 * 60 * 1000
  });

  // res.status(200).json({
  //   message: "Google Login Successful",
  //   token: accessToken
  // });

  res.redirect("https://api.emmanuelawobodu.com/typescript/products");
});