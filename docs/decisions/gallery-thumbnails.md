# Gallery thumbnail delivery

Issue #101 uses committed JPEG derivatives for the currently published raster case-study assets. Each derivative preserves the source aspect ratio and is fitted to a maximum 320px edge with quality 80. The publication manifest and its source approval records remain unchanged; the derivatives are delivery artifacts selected through `src/lib/caseStudyThumbnails.js`.

To regenerate a reviewed derivative on macOS, create it outside `public/` first so an old immutable-cache URL cannot be overwritten:

```sh
thumb_tmp_dir=$(mktemp -d /tmp/horizons-gallery-thumb.XXXXXX)
sips -s format jpeg -s formatOptions 80 -Z 320 \
  public/assets/case-studies/n8n-excel-to-json.png \
  --out "$thumb_tmp_dir/n8n-excel-to-json-thumb.jpg"
thumb_hash=$(shasum -a 256 "$thumb_tmp_dir/n8n-excel-to-json-thumb.jpg" | awk '{print substr($1, 1, 12)}')
mv "$thumb_tmp_dir/n8n-excel-to-json-thumb.jpg" \
  "public/assets/case-studies/n8n-excel-to-json-thumb-${thumb_hash}.jpg"
rmdir "$thumb_tmp_dir"
```

Review the output dimensions and bytes, update the registry `src` to the new `thumb-${thumb_hash}.jpg` path, and update `thumbnailSha256` using:

```sh
shasum -a 256 public/assets/case-studies/n8n-excel-to-json.png \
  public/assets/case-studies/n8n-excel-to-json-thumb-${thumb_hash}.jpg
```

The registry currently covers the 14 raster files used by the published galleries and covers. The Vite publication boundary emits a derivative only when its approved source is already referenced by the compiled publication, and verifies both hashes plus the JPEG/320px contract. Because case-study assets are served with a one-year immutable cache, changed derivative bytes must use a new hash-bearing URL; update the registry first, then remove the superseded local derivative. A future or synthetic source without a registry entry keeps the existing original URL fallback and receives no derived delivery asset until it is explicitly added and reviewed.
