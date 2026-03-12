
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export function handlePrismaError(error: unknown) {
  if (error instanceof PrismaClientKnownRequestError) {

    if (error.code === "P2025") {
      return {
        status: 404,
        message: "Record not found"
      }
    }
  }

  //Other prisma error
  if (error instanceof PrismaClientInitializationError) {
    return {
      status: 400,
      message: "Invalid request"
    }
  }

  return {
    status: 500,
    message: "Something went wrog please try again later"
  }
}