import { Request, Response, NextFunction } from "express";
import { asyncHandler, appError } from "../utils/appError";
import { productTypes, productBody, idParams } from "../types/userTypes";
import prisma from "../prisma/prismaClient";
import QueryBuilder from "../utils/queryBuilder";
import { handlePrismaError } from "../utils/handleErrorPrisma";
import { validate as isUUID } from "uuid";
import uploadToCloudinary from "../cloudinary/cloudianryHelpers";
import cloudinary from "../cloudinary/cloudinary";


export const addProduct = asyncHandler(async (req: Request<{}, {}, productTypes>, res: Response, next: NextFunction) => {
  const { name, description, price } = req.body;

  const userId = req.user?.id

  if (!req.file) {
    return next(new appError("The product image needs to be uploaded", 400));
  }

  const result = await uploadToCloudinary(req.file?.path)

  //console.log(result);

  const productImageId = result?.productImageId;
  const productImageUrl = result?.productImageUrl

  try {
    const newProduct = await prisma.product.create({
      data: {
        productImageId,
        productImageUrl,
        name,
        Description: description,
        price: Number(price),
        uploaderId: userId as string
      }
    })

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
  const allowedFields = ['id', 'name', 'price', 'InStock', 'Description', 'uploaderId', "createdAt", "updatedAt"];

  const builder = new QueryBuilder(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();

  try {
    const users = await prisma.product.findMany(builder.query);

    res.status(200).json({
      status: 'success',
      data: users,
      length: users.length
    });
  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});

export const getProductById = asyncHandler(async (req: Request<idParams>, res: Response, next: NextFunction) => {
  const productId = req.params.id;

  //Validate the id
  if (!isUUID(productId)) return next(new appError("Invalid id format", 400));

  const product = await prisma.product.findUnique({
    where: {
      id: productId
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

  //Validate the id
  if (!isUUID(productId)) return next(new appError("Invalid id format", 400));

  try {

    const product = await prisma.product.delete({
      where: {
        id: productId
      }
    });

    //delete from cloudinary
    await cloudinary.uploader.destroy(product.productImageId as string);

    res.status(200).json({
      message: "Product deleted successfully",
      product
    });

  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});


export const updateProduct = asyncHandler(async (req: Request<idParams, {}, productBody>, res: Response, next: NextFunction) => {
  const { name, price, InStock, description } = req.body;
  const { id } = req.params;

  const numPrice = Number(price);

  //Validate the id 
  if (!isUUID(id)) return next(new appError("Invalid id format", 400));

  try {

    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name,
        price: numPrice,
        InStock,
        Description: description
      }
    });

    res.status(200).json({
      message: "Product Updated successfully",
      product
    });

  } catch (error) {
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ message });
  }
});