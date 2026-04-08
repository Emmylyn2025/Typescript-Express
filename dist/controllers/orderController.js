"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrder = exports.viewOrders = exports.createOrder = void 0;
const appError_1 = require("../utils/appError");
const queryBuilder_1 = __importDefault(require("../utils/queryBuilder"));
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const handleErrorPrisma_1 = require("../utils/handleErrorPrisma");
exports.createOrder = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    //Check if product exists in user cart
    const cart = await prismaClient_1.default.cart.findUnique({
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
        return next(new appError_1.appError("You don't have a cart with us, add a product to create a cart", 400));
    }
    if (cart.items.length === 0)
        return next(new appError_1.appError("Your cart is empty", 400));
    let total = 0;
    //Calculate the total price
    cart.items.forEach((item) => {
        total = (item.quantity * item.product.price) + total;
    });
    const order = await prismaClient_1.default.$transaction(async (tx) => {
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
    });
});
exports.viewOrders = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    const allowedFields = ["id", "status", "total", "createdAt", "updatedAt"];
    const builder = new queryBuilder_1.default(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();
    //Get all orders
    const orders = await prismaClient_1.default.orders.findMany({
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
    });
    if (orders.length === 0 || !orders) {
        return next(new appError_1.appError("No order found", 404));
    }
    res.status(200).json({
        status: 'success',
        data: orders
    });
});
exports.deleteOrder = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    const id = req.params?.id;
    //Find user
    const order = await prismaClient_1.default.orders.findUnique({
        where: {
            id
        }
    });
    if (!order)
        return next(new appError_1.appError("Order not found", 404));
    if (order.userId !== userId)
        return next(new appError_1.appError("This is not your order to delete", 403));
    try {
        //Find the order by user id
        const order = await prismaClient_1.default.orders.delete({
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
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
