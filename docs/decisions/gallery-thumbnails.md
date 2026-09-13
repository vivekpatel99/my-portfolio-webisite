# Gallery thumbnail delivery

Issue #101 uses committed JPEG derivatives for the currently published raster case-study assets. Each derivative preserves the source aspect ratio and is fitted to a maximum 320px edge with quality 80. The publication manifest and its source approval records remain unchanged; the derivatives are delivery artifacts selected through `src/lib/caseStudyThumbnails.js`.

To regenerate a reviewed derivative on macOS, run:

```sh
sips -s format jpeg -s formatOptions 80 -Z 320 \
  public/assets/case-studies/n8n-excel-to-json.png \
  --out public/assets/case-studies/n8n-excel-to-json-thumb.jpg
```

Review the output dimensions and bytes, then update the matching `sourceSha256` and `thumbnailSha256` values in the registry using:

```sh
shasum -a 256 public/assets/case-studies/n8n-excel-to-json.png \
  public/assets/case-studies/n8n-excel-to-json-thumb.jpg
```

The registry currently covers the 14 raster files used by the published galleries and covers. The Vite publication boundary emits a derivative only when its approved source is already referenced by the compiled publication, and verifies both hashes plus the JPEG/320px contract. A future or synthetic source without a registry entry keeps the existing original URL fallback and receives no derived delivery asset until it is explicitly added and reviewed.
