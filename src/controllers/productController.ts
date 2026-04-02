import { Request, Response, NextFunction } from "express";
import { asyncHandler, appError } from "../utils/appError";
import { productTypes, productBody, idParams } from "../types/userTypes";
import prisma from "../prisma/prismaClient";
import QueryBuilder from "../utils/queryBuilder";
import { handlePrismaError } from "../utils/handleErrorPrisma";
import { validate as isUUID } from "uuid";
import uploadToCloudinary from "../cloudinary/cloudianryHelpers";
import cloudinary from "../cloudinary/cloudinary";
import redisClient from "../redis/redis";;


export const addProduct = asyncHandler(async (req: Request<{}, {}, productTypes>, res: Response, next: NextFunction) => {
  const { name, description, price, InStock } = req.body;

  const userId = req.user?.id

  if (!req.file) {
    return next(new appError("The product image needs to be uploaded", 400));
  }

  const result = await uploadToCloudinary(req.file?.path)

  //console.log(result);

  const productImageId = result?.productImageId as string;
  const productImageUrl = result?.productImageUrl as string;

  try {
    const newProduct = await prisma.product.create({
      data: {
        productImageId: productImageId as string,
        productImageUrl: productImageUrl as string,
        name,
        Description: description,
        price,
        uploaderId: userId as string,
        InStock
      }
    })

    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    res.status(201).json({
      message: "product created successfully",
      newProduct
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});

export const getProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const allowedFields = ['id', 'name', 'price', 'InStock', 'Description', 'uploaderId', "createdAt", "updatedAt", "productImageUrl", "productImageId"];

  const cacheSet = `products:${JSON.stringify(req.query)}`;

  console.log(cacheSet);

  const cacheProd = await redisClient.get(cacheSet);

  if (cacheProd) {
    return res.status(200).json({
      status: 'success',
      data: JSON.parse(cacheProd)
    })
  }

  const builder = new QueryBuilder(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();

  const products = await prisma.product.findMany({
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

  if (!products.length) return next(new appError("No products found", 404));

  await redisClient.set(cacheSet, JSON.stringify(products), {
    EX: 60 + 60 + 60 + 60 + 60
  })

  res.status(200).json({
    status: 'success',
    data: products,
    length: products.length
  });
});

export const getProductById = asyncHandler(async (req: Request<idParams>, res: Response, next: NextFunction) => {
  const productId = req.params.id;

  //Validate the id
  if (!isUUID(productId)) return next(new appError("Invalid id format", 400));

  const product = await prisma.product.findUnique({
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

  if (!product) return next(new appError("Product not found", 404));

  res.status(200).json({
    message: "product found",
    product
  });
});

export const deleteProduct = asyncHandler(async (req: Request<idParams>, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  const userId = req.user?.id;
  //Validate the id
  if (!isUUID(productId)) return next(new appError("Invalid id format", 400));

  //Find product
  const pp = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (pp?.uploaderId !== userId) return next(new appError("You are not allowed to delete this product", 403));

  // try {

  const product = await prisma.product.delete({
    where: {
      id: productId
    }
  });

  //delete from cloudinary
  await cloudinary.uploader.destroy(product.productImageId as string);

  const keys = await redisClient.keys("products:*");
  if (keys.length) await redisClient.del(keys);

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

export const updateProduct = asyncHandler(async (req: Request<idParams, {}, productBody>, res: Response, next: NextFunction) => {
  const { name, price, InStock, description } = req.body;
  const { id } = req.params;


  //Validate the id 
  if (!isUUID(id)) return next(new appError("Invalid id format", 400));

  try {

    let productImageId;
    let productImageUrl;

    if (req.file) {
      const old = await prisma.product.findUnique({
        where: {
          id
        }
      });

      //Delete old image from cloudinary
      await cloudinary.uploader.destroy(old?.productImageId as string);

      const result = await uploadToCloudinary(req.file?.path);

      productImageId = result?.productImageId;
      productImageUrl = result?.productImageUrl;
    }

    const product = await prisma.product.update({
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

    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    res.status(200).json({
      message: "Product Updated successfully",
      product
    });

  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});