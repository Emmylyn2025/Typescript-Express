/*
  Warnings:

  - Added the required column `price` to the `OrderItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
