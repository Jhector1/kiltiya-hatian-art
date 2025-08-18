-- scripts/svg_cleanup.sql

BEGIN;

-- Create backup tables (once). If they exist, they’ll remain empty until we INSERT below.
CREATE TABLE IF NOT EXISTS tmp_svg_asset_backup AS TABLE "ProductAsset" WITH NO DATA;
CREATE TABLE IF NOT EXISTS tmp_svg_downloadtoken_backup AS TABLE "DownloadToken" WITH NO DATA;

-- Append new backups (skip rows we’ve already backed up)
INSERT INTO tmp_svg_asset_backup
SELECT pa.*
FROM "ProductAsset" pa
WHERE (lower(pa."ext") = 'svg' OR lower(pa."mimeType") = 'image/svg+xml')
  AND NOT EXISTS (SELECT 1 FROM tmp_svg_asset_backup b WHERE b.id = pa.id);

INSERT INTO tmp_svg_downloadtoken_backup
SELECT dt.*
FROM "DownloadToken" dt
JOIN "ProductAsset" pa ON pa."id" = dt."assetId"
WHERE (lower(pa."ext") = 'svg' OR lower(pa."mimeType") = 'image/svg+xml')
  AND NOT EXISTS (SELECT 1 FROM tmp_svg_downloadtoken_backup b WHERE b.id = dt.id);

-- Delete tokens that reference SVG assets (safe to do even if FK CASCADE already handles it)
DELETE FROM "DownloadToken" dt
USING "ProductAsset" pa
WHERE dt."assetId" = pa."id"
  AND (lower(pa."ext") = 'svg' OR lower(pa."mimeType") = 'image/svg+xml');

-- Delete the SVG ProductAsset rows
DELETE FROM "ProductAsset"
WHERE lower("ext") = 'svg'
   OR lower("mimeType") = 'image/svg+xml';

COMMIT;

