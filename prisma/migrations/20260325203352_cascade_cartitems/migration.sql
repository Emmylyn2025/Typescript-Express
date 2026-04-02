-- DropForeignKey
ALTER TABLE "CartItems" DROP CONSTRAINT "CartItems_productId_fkey";

-- AddForeignKey
ALTER TABLE "CartItems" ADD CONSTRAINT "CartItems_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
