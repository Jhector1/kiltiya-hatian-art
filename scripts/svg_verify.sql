-- Deliverable SVG assets should be 0
SELECT COUNT(*) AS svg_assets
FROM "ProductAsset"
WHERE lower("ext") = 'svg' OR lower("mimeType") = 'image/svg+xml';

-- Tokens that point to SVG assets should be 0
SELECT COUNT(*) AS svg_tokens
FROM "DownloadToken" dt
WHERE EXISTS (
  SELECT 1 FROM "ProductAsset" pa
  WHERE pa."id" = dt."assetId"
    AND (lower(pa."ext")='svg' OR lower(pa."mimeType")='image/svg+xml')
);

-- Peek at the backup tables (optional)
SELECT COUNT(*) AS backed_up_assets FROM tmp_svg_asset_backup;
SELECT COUNT(*) AS backed_up_tokens FROM tmp_svg_downloadtoken_backup;
