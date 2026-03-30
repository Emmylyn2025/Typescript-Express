import { NextFunction, Request, Response } from "express"
import { asyncHandler, appError } from "../utils/appError"
import prisma from "../prisma/prismaClient";


export const createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;

  //Check if product exists in user cart
  const cart = await prisma.cart.findUnique({
    where: {
      userId
    },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          product: {
            select: {
              price: true
            }
          },
          quantity: true
        }
      }
    }
  });

  if (!cart) {
    return next(new appError("You don't have a cart with us, add a product to create a cart", 400))
  }

  if (cart.items.length === 0) return next(new appError("Your cart is empty", 400));

  let total = 0;

  cart.items.forEach((item) => {
    total = (item.quantity * item.product.price) + total;
  });

  const order = await prisma.$transaction(async (tx) => {
    //Create new order
    const newOrder = await tx.orders.create({
      data: {
        userId,
        total
      }
    });


    //Create order items
    await tx.orderItems.createMany({
      data: cart.items.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }))
    });

    //Clear the cart items
    await tx.cartItems.deleteMany({
      where: {
        cartId: cart.id
      }
    });

    return newOrder;
  });

  res.status(200).json({
    message: "Order Created successfully",
    order
  })
});

export const viewOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;

  //Get user orders
  const orders = await prisma.orders.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      status: true,
      total: true,
      orderItems: {
        select: {
          orderId: true,
          productId: true,
          price: true,
          quantity: true
        }
      }
    }
  });


  if (orders.length === 0 || !orders) {
    return next(new appError("No order found", 404));
  }

  res.status(200).json({
    status: 'success',
    data: orders
  });
});