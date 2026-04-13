import prisma from "../prisma/prismaClient";
import { asyncHandler } from "../utils/appError";
import { Request, Response, NextFunction } from "express";
import { validate as isUUID } from "uuid";
import { appError } from "../utils/appError";

type addProd = {
  productId: string,
  quantity: number
}

export const addToCart = asyncHandler(async (req: Request<{}, {}, addProd>, res: Response, next: NextFunction) => {
  const { productId, quantity } = req.body;

  const userId = req.user?.id as string;

  //Validate product id
  if (!isUUID(productId)) return next(new appError("Invalid product id format", 400));

  if (quantity < 1) return next(new appError("Product quantity cannot be negative or zero", 400));

  //Check if the products exists in the database
  const product = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (!product) {
    return next(new appError("This product is not found in the database", 404));
  }

  //Check if the user cart exists before
  let cart = await prisma.cart.findUnique({
    where: { userId }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId
      }
    })
  }

  const existingItem = await prisma.cartItems.findFirst({
    where: {
      cartId: cart?.id,
      productId
    }
  });

  if (existingItem) {
    const update = await prisma.cartItems.update({
      where: {
        id: existingItem?.id
      },
      data: {
        quantity: existingItem?.quantity + quantity
      }
    })

    return res.status(200).json({
      message: "Quantity updated successfully",
      update
    });
  }

  const newItem = await prisma.cartItems.create({
    data: {
      cartId: cart.id,
      productId,
      quantity
    }
  })

  res.status(200).json({
    message: "Items added to cart",
    item: newItem
  })
});

export const getUserCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  //Get user cart
  const cart = await prisma.cart.findUnique({
    where: {
      userId
    },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          product: {
            select: {
              productImageUrl: true,
              name: true,
              price: true
            }
          }
        }
      }
    }
  });

  if (!cart) return next(new appError("Cart not found", 404));

  res.status(200).json({
    message: "Cart retreived",
    cart
  });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const itemId = req.params.itemId as string;
  const quantity = req.body.quantity as number;
  const userId = req.user?.id as string;

  if (!isUUID(itemId)) return next(new appError("Invalid item id id format", 400));

  if (quantity < 0) {
    return next(new appError("Item quantity cannot be less than zero", 400));

  } else if (quantity === 0) {

    await prisma.cartItems.delete({
      where: {
        id: itemId
      }
    });

    return res.status(200).json({
      status: "success",
      message: "Product removed successfully"
    });
  }

  //Check if the item exists in cart item
  const item = await prisma.cart.findUnique({
    where: {
      userId
    },
    select: {
      items: {
        select: {
          id: true,
          quantity: true,
          productId: true,
          product: {
            select: {
              name: true,
              price: true,
              productImageUrl: true
            }
          }
        }
      }
    }
  });

  let found: any;
  item?.items.forEach((one) => {
    if (one.id === itemId) {
      found = one
    }
    //console.log(one);
  });

  if (!found) {
    return next(new appError("This product is not present in the cart", 404));
  }

  //Update the quantity of the item
  const update = await prisma.cartItems.update({
    where: {
      id: found?.id
    },
    data: {
      quantity
    }
  });

  res.status(200).json({
    message: "Item updates successfully",
    data: update
  });
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const itemId = req.params.itemId as string;

  const userId = req.user?.id as string;

  if (!isUUID(itemId)) return next(new appError("Invalid item id id format", 400));

  //Check if the item exists in cart item
  const item = await prisma.cart.findUnique({
    where: {
      userId
    },
    select: {
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          product: {
            select: {
              productImageUrl: true,
              name: true,
              price: true
            }
          }
        }
      }
    }
  });

  let found: any;
  item?.items.forEach((one) => {
    if (one.id === itemId) {
      found = one
    }
  });

  if (!found) {
    return next(new appError("This product is not present in the cart", 404));
  }

  let deleteItem;
  let passOne;

  if (found?.quantity > 1) {
    const remover = found?.quantity - 1;


    passOne = await prisma.cartItems.update({
      where: {
        id: found?.id
      },
      data: {
        quantity: remover
      }
    })

    return res.status(200).json({
      message: "One item removed successfully",
      data: passOne
    })

  } else if (found?.quantity === 1) {

  deleteItem = await prisma.cartItems.delete({
    where: {
      id: found?.id
    }
  });

  }

  res.status(200).json({
    message: "Item deleted successfully",
    data: deleteItem
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;

  const cart = await prisma.cart.findUnique({
    where: {
      userId
    }
  });

  if (!cart) return next(new appError("Cart not found", 404));

  //Clear the user cart
  await prisma.cartItems.deleteMany({
    where: {
      cartId: cart.id
    }
  });

  res.status(204).json({
    message: "Your cart was cleared"
  });
})