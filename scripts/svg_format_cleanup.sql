-- ---------------------------
-- OPTIONAL (run separately if you want)
-- Scrub any .svg URLs from Product.formats[]
-- ---------------------------
UPDATE "Product"
SET "formats" = ARRAY(
  SELECT f FROM unnest("formats") AS f
  WHERE f !~* '\.svg(\?|#|$)'
)
WHERE EXISTS (
  SELECT 1 FROM unnest("formats") AS f
  WHERE f ~* '\.svg(\?|#|$)'
);
