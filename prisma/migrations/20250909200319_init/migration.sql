-- CreateEnum
CREATE TYPE "public"."VariantType" AS ENUM ('DIGITAL', 'PRINT');

-- CreateEnum
CREATE TYPE "public"."CldResourceType" AS ENUM ('image', 'raw', 'video');

-- CreateEnum
CREATE TYPE "public"."CldDeliveryType" AS ENUM ('upload', 'authenticated', 'private');

-- CreateEnum
CREATE TYPE "public"."EntitlementSource" AS ENUM ('PURCHASE', 'TOPUP', 'GRANT');

-- CreateEnum
CREATE TYPE "public"."UsageKind" AS ENUM ('EXPORT', 'EDIT');

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "label" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "digitalVariantId" TEXT,
    "printVariantId" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "designId" TEXT,
    "previewUrlSnapshot" VARCHAR(2000),
    "styleSnapshot" JSONB,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DesignEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "productId" TEXT NOT NULL,
    "userDesignId" TEXT,
    "purchasedDesignId" TEXT,
    "source" "public"."EntitlementSource" NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "exportQuota" INTEGER NOT NULL DEFAULT 0,
    "editQuota" INTEGER NOT NULL DEFAULT 0,
    "exportsUsed" INTEGER NOT NULL DEFAULT 0,
    "editsUsed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DesignUsage" (
    "id" TEXT NOT NULL,
    "kind" "public"."UsageKind" NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "productId" TEXT NOT NULL,
    "userDesignId" TEXT,
    "purchasedDesignId" TEXT,
    "entitlementId" TEXT NOT NULL,
    "format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "meta" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DownloadToken" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "userId" TEXT,
    "guestId" TEXT,
    "signedUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "remainingUses" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadedAt" TIMESTAMP(3),
    "licenseSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shippingId" TEXT,
    "stripeSessionId" TEXT,
    "claimTokenHash" TEXT,
    "claimTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "digitalVariantId" TEXT,
    "printVariantId" TEXT,
    "type" "public"."VariantType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "listPrice" DOUBLE PRECISION,
    "previewUrlSnapshot" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "publicId" TEXT NOT NULL,
    "sizes" TEXT[],
    "thumbnails" TEXT[],
    "formats" TEXT[],
    "svgFormat" TEXT,
    "svgPreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salePercent" INTEGER,
    "salePrice" DOUBLE PRECISION,
    "saleStartsAt" TIMESTAMP(3),
    "saleEndsAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductAsset" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storageKey" TEXT,
    "url" TEXT NOT NULL,
    "previewUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "isVector" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "dpi" INTEGER,
    "colorProfile" TEXT,
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "pdfPageCount" INTEGER,
    "pdfPageWIn" DOUBLE PRECISION,
    "pdfPageHIn" DOUBLE PRECISION,
    "svgViewBox" TEXT,
    "hasAlpha" BOOLEAN,
    "isAnimated" BOOLEAN,
    "resourceType" "public"."CldResourceType",
    "deliveryType" "public"."CldDeliveryType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "public"."VariantType" NOT NULL,
    "format" TEXT,
    "license" TEXT,
    "size" TEXT,
    "material" TEXT,
    "frame" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchasedDesign" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "style" JSONB NOT NULL,
    "defs" JSONB,
    "svg" JSONB,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasedDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarUrl" VARCHAR(255),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDesign" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "productId" TEXT NOT NULL,
    "style" JSONB NOT NULL,
    "defs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previewPublicId" VARCHAR(255),
    "previewUrl" VARCHAR(2000),
    "previewUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "UserDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_guestId_idx" ON "public"."Address"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "public"."Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_guestId_key" ON "public"."Cart"("guestId");

-- CreateIndex
CREATE INDEX "Cart_guestId_idx" ON "public"."Cart"("guestId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "public"."CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_designId_idx" ON "public"."CartItem"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "DesignEntitlement_guestId_idx" ON "public"."DesignEntitlement"("guestId");

-- CreateIndex
CREATE INDEX "DesignEntitlement_orderItemId_idx" ON "public"."DesignEntitlement"("orderItemId");

-- CreateIndex
CREATE INDEX "DesignEntitlement_productId_idx" ON "public"."DesignEntitlement"("productId");

-- CreateIndex
CREATE INDEX "DesignEntitlement_purchasedDesignId_idx" ON "public"."DesignEntitlement"("purchasedDesignId");

-- CreateIndex
CREATE INDEX "DesignEntitlement_userDesignId_idx" ON "public"."DesignEntitlement"("userDesignId");

-- CreateIndex
CREATE INDEX "DesignEntitlement_userId_idx" ON "public"."DesignEntitlement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignUsage_idempotencyKey_key" ON "public"."DesignUsage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DesignUsage_entitlementId_idx" ON "public"."DesignUsage"("entitlementId");

-- CreateIndex
CREATE INDEX "DesignUsage_guestId_idx" ON "public"."DesignUsage"("guestId");

-- CreateIndex
CREATE INDEX "DesignUsage_productId_idx" ON "public"."DesignUsage"("productId");

-- CreateIndex
CREATE INDEX "DesignUsage_userId_idx" ON "public"."DesignUsage"("userId");

-- CreateIndex
CREATE INDEX "DownloadToken_assetId_idx" ON "public"."DownloadToken"("assetId");

-- CreateIndex
CREATE INDEX "DownloadToken_guestId_idx" ON "public"."DownloadToken"("guestId");

-- CreateIndex
CREATE INDEX "DownloadToken_orderId_assetId_idx" ON "public"."DownloadToken"("orderId", "assetId");

-- CreateIndex
CREATE INDEX "DownloadToken_orderId_idx" ON "public"."DownloadToken"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_guestId_productId_key" ON "public"."Favorite"("guestId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "public"."Favorite"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "public"."Order"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_claimTokenHash_key" ON "public"."Order"("claimTokenHash");

-- CreateIndex
CREATE INDEX "Order_claimTokenExpiresAt_idx" ON "public"."Order"("claimTokenExpiresAt");

-- CreateIndex
CREATE INDEX "Order_guestId_idx" ON "public"."Order"("guestId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "Product_saleEndsAt_idx" ON "public"."Product"("saleEndsAt");

-- CreateIndex
CREATE INDEX "Product_saleStartsAt_saleEndsAt_idx" ON "public"."Product"("saleStartsAt", "saleEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAsset_storageKey_key" ON "public"."ProductAsset"("storageKey");

-- CreateIndex
CREATE INDEX "ProductAsset_productId_idx" ON "public"."ProductAsset"("productId");

-- CreateIndex
CREATE INDEX "ProductAsset_url_idx" ON "public"."ProductAsset"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAsset_productId_url_key" ON "public"."ProductAsset"("productId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedDesign_orderItemId_key" ON "public"."PurchasedDesign"("orderItemId");

-- CreateIndex
CREATE INDEX "PurchasedDesign_orderId_idx" ON "public"."PurchasedDesign"("orderId");

-- CreateIndex
CREATE INDEX "PurchasedDesign_productId_idx" ON "public"."PurchasedDesign"("productId");

-- CreateIndex
CREATE INDEX "PurchasedDesign_userId_idx" ON "public"."PurchasedDesign"("userId");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "public"."Review"("guestId");

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "public"."Review"("productId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "public"."Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "UserDesign_guestId_idx" ON "public"."UserDesign"("guestId");

-- CreateIndex
CREATE INDEX "UserDesign_productId_idx" ON "public"."UserDesign"("productId");

-- CreateIndex
CREATE INDEX "UserDesign_userId_idx" ON "public"."UserDesign"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDesign_guestId_productId_key" ON "public"."UserDesign"("guestId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDesign_userId_productId_key" ON "public"."UserDesign"("userId", "productId");

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "public"."UserDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_digitalVariantId_fkey" FOREIGN KEY ("digitalVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_printVariantId_fkey" FOREIGN KEY ("printVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignEntitlement" ADD CONSTRAINT "DesignEntitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignEntitlement" ADD CONSTRAINT "DesignEntitlement_purchasedDesignId_fkey" FOREIGN KEY ("purchasedDesignId") REFERENCES "public"."PurchasedDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignEntitlement" ADD CONSTRAINT "DesignEntitlement_userDesignId_fkey" FOREIGN KEY ("userDesignId") REFERENCES "public"."UserDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignEntitlement" ADD CONSTRAINT "DesignEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignUsage" ADD CONSTRAINT "DesignUsage_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "public"."DesignEntitlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignUsage" ADD CONSTRAINT "DesignUsage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignUsage" ADD CONSTRAINT "DesignUsage_userDesignId_fkey" FOREIGN KEY ("userDesignId") REFERENCES "public"."UserDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DownloadToken" ADD CONSTRAINT "DownloadToken_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."ProductAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DownloadToken" ADD CONSTRAINT "DownloadToken_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DownloadToken" ADD CONSTRAINT "DownloadToken_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DownloadToken" ADD CONSTRAINT "DownloadToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_shippingId_fkey" FOREIGN KEY ("shippingId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_digitalVariantId_fkey" FOREIGN KEY ("digitalVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_printVariantId_fkey" FOREIGN KEY ("printVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductAsset" ADD CONSTRAINT "ProductAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchasedDesign" ADD CONSTRAINT "PurchasedDesign_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchasedDesign" ADD CONSTRAINT "PurchasedDesign_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchasedDesign" ADD CONSTRAINT "PurchasedDesign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchasedDesign" ADD CONSTRAINT "PurchasedDesign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDesign" ADD CONSTRAINT "UserDesign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDesign" ADD CONSTRAINT "UserDesign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
