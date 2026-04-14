import { NextFunction, Request, Response } from "express"
import { asyncHandler, appError } from "../utils/appError"
import QueryBuilder from "../utils/queryBuilder";
import prisma from "../prisma/prismaClient";
import { handlePrismaError } from "../utils/handleErrorPrisma";


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
              productImageUrl: true,
              name: true,
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

  //Calculate the total price
  cart.items.forEach((item: any) => {
    total = (item.quantity * item.product.price) + total;
  });

  const order = await prisma.$transaction(async (tx: any) => {
    //Create new order
    const newOrder = await tx.orders.create({
      data: {
        userId,
        total
      }
    });


    //Create order items
    await tx.orderItems.createMany({
      data: cart.items.map((item: any) => ({
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

  const allowedFields = ["id", "status", "total", "createdAt", "updatedAt"];

  const builder = new QueryBuilder(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();

  //Get all orders
  const orders = await prisma.orders.findMany({
    ...builder.query,
    where: {
      ...(builder.query.where || {}),
      userId
    },
    select: {
      ...(builder.query.select || {}),
      orderItems: {
        select: {
          orderId: true,
          productId: true,
          price: true,
          quantity: true,
          product: {
            select: {
              productImageUrl: true
            }
          }
        }
      }
    }
  })


  if (orders.length === 0 || !orders) {
    return next(new appError("No order found", 404));
  }

  res.status(200).json({
    status: 'success',
    data: orders
  });
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const id = req.params?.id as string;

  //Find user
  const order = await prisma.orders.findUnique({
    where: {
      id
    }
  });

  if (!order) return next(new appError("Order not found", 404));
  if (order.userId !== userId) return next(new appError("This is not your order to delete", 403));

  try {

    //Find the order by user id
    const order = await prisma.orders.delete({
      where: {
        id
      },
      select: {
        id: true,
        total: true,
        status: true,
        orderItems: {
          select: {
            price: true,
            quantity: true,
            productId: true,
            product: {
              select: {
                productImageUrl: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      message: "Order deleted successfully",
      order
    });

  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});