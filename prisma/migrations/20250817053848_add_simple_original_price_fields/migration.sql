-- 1) Add as NULLABLE first (use NUMERIC/DECIMAL for prices)
ALTER TABLE "public"."CartItem"
  ADD COLUMN "originalPrice" NUMERIC(10,2);

-- 2) Backfill from existing columns
-- If you have both, prefer compareAt, else fall back to price
UPDATE "public"."CartItem"
SET "originalPrice" = COALESCE("compareAt", "price");

-- 3) Safety fill (in case either was NULL)
UPDATE "public"."CartItem"
SET "originalPrice" = 0
WHERE "originalPrice" IS NULL;

-- 4) nEnforce NOT NULL
ALTER TABLE "public"."CartItem"
  ALTER COLUMN "originalPrice" SET NOT NULL;
