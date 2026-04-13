"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.getUserCart = exports.addToCart = void 0;
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const appError_1 = require("../utils/appError");
const uuid_1 = require("uuid");
const appError_2 = require("../utils/appError");
exports.addToCart = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;
    //Validate product id
    if (!(0, uuid_1.validate)(productId))
        return next(new appError_2.appError("Invalid product id format", 400));
    if (quantity < 1)
        return next(new appError_2.appError("Product quantity cannot be negative or zero", 400));
    //Check if the products exists in the database
    const product = await prismaClient_1.default.product.findUnique({
        where: {
            id: productId
        }
    });
    if (!product) {
        return next(new appError_2.appError("This product is not found in the database", 404));
    }
    //Check if the user cart exists before
    let cart = await prismaClient_1.default.cart.findUnique({
        where: { userId }
    });
    if (!cart) {
        cart = await prismaClient_1.default.cart.create({
            data: {
                userId
            }
        });
    }
    const existingItem = await prismaClient_1.default.cartItems.findFirst({
        where: {
            cartId: cart?.id,
            productId
        }
    });
    if (existingItem) {
        const update = await prismaClient_1.default.cartItems.update({
            where: {
                id: existingItem?.id
            },
            data: {
                quantity: existingItem?.quantity + quantity
            }
        });
        return res.status(200).json({
            message: "Quantity updated successfully",
            update
        });
    }
    const newItem = await prismaClient_1.default.cartItems.create({
        data: {
            cartId: cart.id,
            productId,
            quantity
        }
    });
    res.status(200).json({
        message: "Items added to cart",
        item: newItem
    });
});
exports.getUserCart = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    //Get user cart
    const cart = await prismaClient_1.default.cart.findUnique({
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
    if (!cart)
        return next(new appError_2.appError("Cart not found", 404));
    res.status(200).json({
        message: "Cart retreived",
        cart
    });
});
exports.updateCartItem = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const itemId = req.params.itemId;
    const quantity = req.body.quantity;
    const userId = req.user?.id;
    if (!(0, uuid_1.validate)(itemId))
        return next(new appError_2.appError("Invalid item id id format", 400));
    if (quantity < 0) {
        return next(new appError_2.appError("Item quantity cannot be less than zero", 400));
    }
    else if (quantity === 0) {
        await prismaClient_1.default.cartItems.delete({
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
    const item = await prismaClient_1.default.cart.findUnique({
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
    let found;
    item?.items.forEach((one) => {
        if (one.id === itemId) {
            found = one;
        }
        //console.log(one);
    });
    if (!found) {
        return next(new appError_2.appError("This product is not present in the cart", 404));
    }
    //Update the quantity of the item
    const update = await prismaClient_1.default.cartItems.update({
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
exports.removeFromCart = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const itemId = req.params.itemId;
    const userId = req.user?.id;
    if (!(0, uuid_1.validate)(itemId))
        return next(new appError_2.appError("Invalid item id id format", 400));
    //Check if the item exists in cart item
    const item = await prismaClient_1.default.cart.findUnique({
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
    let found;
    item?.items.forEach((one) => {
        if (one.id === itemId) {
            found = one;
        }
    });
    if (!found) {
        return next(new appError_2.appError("This product is not present in the cart", 404));
    }
    let deleteItem;
    let passOne;
    if (found?.quantity > 1) {
        const remover = found?.quantity - 1;
        passOne = await prismaClient_1.default.cartItems.update({
            where: {
                id: found?.id
            },
            data: {
                quantity: remover
            }
        });
        return res.status(200).json({
            message: "One item removed successfully",
            data: passOne
        });
    }
    else if (found?.quantity === 1) {
        deleteItem = await prismaClient_1.default.cartItems.delete({
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
exports.clearCart = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    const cart = await prismaClient_1.default.cart.findUnique({
        where: {
            userId
        }
    });
    if (!cart)
        return next(new appError_2.appError("Cart not found", 404));
    //Clear the user cart
    await prismaClient_1.default.cartItems.deleteMany({
        where: {
            cartId: cart.id
        }
    });
    res.status(204).json({
        message: "Your cart was cleared"
    });
});
