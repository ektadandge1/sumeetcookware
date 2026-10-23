# Amazon brandstore export

`export-brandstore.mjs` reads the public Sumeet Amazon India brandstore and its
navigation pages using Playwright. It does not log in, modify Shopify, add items
to a cart, or bypass CAPTCHA. Failed pages are reported rather than silently
treated as empty categories.

Run with an existing Playwright installation and Chromium browser:

```bash
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright/index.mjs \
CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome \
node scripts/amazon/export-brandstore.mjs data/amazon-brandstore/YYYY-MM-DD
```

If `playwright` is installed normally, omit `PLAYWRIGHT_MODULE_PATH`. If its
default Chromium installation is available, omit `CHROMIUM_EXECUTABLE_PATH`.
Use a new output directory for each snapshot to preserve previous exports.

## Files

- `category-products.csv`: category-to-ASIN mapping, including product titles,
  product links, image URLs, observed prices, and source page URLs.
- `products.csv`: unique ASINs from category widgets, without duplicates across
  pages. ASIN variants remain separate products.
- `categories.csv`: page coverage, extraction failures, and product counts.
- `recommendations.csv`: dynamic carousel/recommendation observations kept separate
  from category mappings to avoid assigning unrelated best sellers.
- `brandstore.json`: the combined export, widget provenance, coverage summary,
  and limitations.

Membership comes from public page widget configuration rather than inferring
categories from product titles. Configured ASINs are retained even if Amazon
doesn't return their titles or prices (for example, unavailable or unloaded
items). A public brandstore snapshot
is not a complete seller catalog and doesn't enumerate every possible product
variation. Image URLs are recorded, but image files aren't downloaded.

All carousel widgets are conservatively separated, even if they have a
configured ASIN list. Review `recommendations.csv` if a carousel was intentionally
curated for a category.
