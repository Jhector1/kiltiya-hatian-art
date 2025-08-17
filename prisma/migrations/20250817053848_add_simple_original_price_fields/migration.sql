/*
  Warnings:

  - Added the required column `originalPrice` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CartItem" ADD COLUMN     "originalPrice" DOUBLE PRECISION NOT NULL;
