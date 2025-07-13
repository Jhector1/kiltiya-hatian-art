/*
  Warnings:

  - You are about to drop the column `type` on the `CartItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('DIGITAL', 'PRINT');

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "type",
ADD COLUMN     "digitalVariantId" TEXT,
ADD COLUMN     "printVariantId" TEXT;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "VariantType" NOT NULL,
    "format" TEXT NOT NULL,
    "size" TEXT,
    "material" TEXT,
    "frame" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_digitalVariantId_fkey" FOREIGN KEY ("digitalVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_printVariantId_fkey" FOREIGN KEY ("printVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
