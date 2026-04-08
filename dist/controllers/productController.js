"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.deleteProduct = exports.getProductById = exports.getProducts = exports.addProduct = void 0;
const appError_1 = require("../utils/appError");
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const queryBuilder_1 = __importDefault(require("../utils/queryBuilder"));
const handleErrorPrisma_1 = require("../utils/handleErrorPrisma");
const uuid_1 = require("uuid");
const cloudianryHelpers_1 = __importDefault(require("../cloudinary/cloudianryHelpers"));
const cloudinary_1 = __importDefault(require("../cloudinary/cloudinary"));
const redis_1 = __importDefault(require("../redis/redis"));
;
exports.addProduct = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { name, description, price, InStock } = req.body;
    const userId = req.user?.id;
    if (!req.file) {
        return next(new appError_1.appError("The product image needs to be uploaded", 400));
    }
    const result = await (0, cloudianryHelpers_1.default)(req.file?.path);
    //console.log(result);
    const productImageId = result?.productImageId;
    const productImageUrl = result?.productImageUrl;
    try {
        const newProduct = await prismaClient_1.default.product.create({
            data: {
                productImageId: productImageId,
                productImageUrl: productImageUrl,
                name,
                Description: description,
                price,
                uploaderId: userId,
                InStock
            }
        });
        const keys = await redis_1.default.keys("products:*");
        if (keys.length)
            await redis_1.default.del(keys);
        res.status(201).json({
            message: "product created successfully",
            newProduct
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
exports.getProducts = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const allowedFields = ['id', 'name', 'price', 'InStock', 'Description', 'uploaderId', "createdAt", "updatedAt", "productImageUrl", "productImageId"];
    const cacheSet = `products:${JSON.stringify(req.query)}`;
    console.log(cacheSet);
    const cacheProd = await redis_1.default.get(cacheSet);
    if (cacheProd) {
        return res.status(200).json({
            status: 'success',
            data: JSON.parse(cacheProd)
        });
    }
    const builder = new queryBuilder_1.default(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();
    const products = await prismaClient_1.default.product.findMany({
        ...builder.query,
        select: {
            ...(builder.query.select || {}),
            uploader: {
                select: {
                    id: true,
                    username: true,
                    role: true
                }
            }
        }
    });
    if (!products.length)
        return next(new appError_1.appError("No products found", 404));
    await redis_1.default.set(cacheSet, JSON.stringify(products), {
        EX: 60 + 60 + 60 + 60 + 60
    });
    res.status(200).json({
        status: 'success',
        data: products,
        length: products.length
    });
});
exports.getProductById = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const productId = req.params.id;
    //Validate the id
    if (!(0, uuid_1.validate)(productId))
        return next(new appError_1.appError("Invalid id format", 400));
    const product = await prismaClient_1.default.product.findUnique({
        where: {
            id: productId
        },
        include: {
            uploader: {
                select: {
                    id: true,
                    username: true,
                    role: true
                }
            }
        }
    });
    if (!product)
        return next(new appError_1.appError("Product not found", 404));
    res.status(200).json({
        message: "product found",
        product
    });
});
exports.deleteProduct = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const productId = req.params.id;
    const userId = req.user?.id;
    //Validate the id
    if (!(0, uuid_1.validate)(productId))
        return next(new appError_1.appError("Invalid id format", 400));
    //Find product
    const pp = await prismaClient_1.default.product.findUnique({
        where: {
            id: productId
        }
    });
    if (pp?.uploaderId !== userId)
        return next(new appError_1.appError("You are not allowed to delete this product", 403));
    // try {
    const product = await prismaClient_1.default.product.delete({
        where: {
            id: productId
        }
    });
    //delete from cloudinary
    await cloudinary_1.default.uploader.destroy(product.productImageId);
    const keys = await redis_1.default.keys("products:*");
    if (keys.length)
        await redis_1.default.del(keys);
    res.status(200).json({
        message: "Product deleted successfully",
        product
    });
    //} 
    //catch (error) {
    //   const { status, message } = handlePrismaError(error);
    //   res.status(status).json({ message });
    // }
});
exports.updateProduct = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { name, price, InStock, description } = req.body;
    const { id } = req.params;
    //Validate the id 
    if (!(0, uuid_1.validate)(id))
        return next(new appError_1.appError("Invalid id format", 400));
    try {
        let productImageId;
        let productImageUrl;
        if (req.file) {
            const old = await prismaClient_1.default.product.findUnique({
                where: {
                    id
                }
            });
            //Delete old image from cloudinary
            await cloudinary_1.default.uploader.destroy(old?.productImageId);
            const result = await (0, cloudianryHelpers_1.default)(req.file?.path);
            productImageId = result?.productImageId;
            productImageUrl = result?.productImageUrl;
        }
        const product = await prismaClient_1.default.product.update({
            where: {
                id
            },
            data: {
                productImageId,
                productImageUrl,
                name,
                price,
                InStock,
                Description: description
            }
        });
        const keys = await redis_1.default.keys("products:*");
        if (keys.length)
            await redis_1.default.del(keys);
        res.status(200).json({
            message: "Product Updated successfully",
            product
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
