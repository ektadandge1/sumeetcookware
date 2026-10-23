import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// PLAYWRIGHT_MODULE_PATH can point to an existing Playwright installation.
const {chromium} = process.env.PLAYWRIGHT_MODULE_PATH
  ? await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE_PATH)).href)
  : await import('playwright');
const origin = 'https://www.amazon.in';
const rootId = '5F74BE2B-B22C-468A-8D11-6A3719BDDCE0';
const output = resolve(process.argv[2] || 'data/amazon-brandstore');
const exportedAt = new Date().toISOString();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--disable-dev-shm-usage'],
});
const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
await context.route('**/*', (route) =>
  ['image', 'font', 'media'].includes(route.request().resourceType())
    ? route.abort()
    : route.continue(),
);

// Read public, server-rendered widget JSON without executing inline script text.
function extractWidgets() {
  const widgets = [];
  const parseErrors = [];
  for (const script of document.scripts) {
    const text = script.textContent;
    for (const match of text.matchAll(/var config\s*=\s*\{/g)) {
      const start = match.index + match[0].lastIndexOf('{');
      let depth = 0;
      let quoted = false;
      let escaped = false;
      let end;
      for (let i = start; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === '\\') escaped = true;
          else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === '{') depth++;
        else if (char === '}' && --depth === 0) {
          end = i + 1;
          break;
        }
      }
      try {
        widgets.push(JSON.parse(text.slice(start, end)));
      } catch (error) {
        parseErrors.push(error.message);
      }
    }
  }
  return {widgets, parseErrors, title: document.title};
}

function normalizeWidget(widget) {
  const content = widget.content || {};
  const products = new Map();
  const asins = new Set();
  const validAsin = (value) => typeof value === 'string' && /^[A-Z0-9]{10}$/.test(value);
  function walk(value, key = '') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      if (/^(ASINList|asins|pinnedAsins|requestedAsins)$/i.test(key)) {
        for (const asin of value) if (validAsin(asin)) asins.add(asin);
      }
      for (const child of value) walk(child);
      return;
    }
    if (validAsin(value.asin)) {
      asins.add(value.asin);
      if (value.title?.displayString) {
        const money = value.buyingOptions?.[0]?.price?.priceToPay?.moneyValueOrRange?.value;
        const image = value.productImages?.images?.[0];
        products.set(value.asin, {
          asin: value.asin,
          title: value.title.displayString,
          product_url: `${origin}/dp/${value.asin}`,
          image_url: image?.hiRes?.url || image?.lowRes?.url || '',
          price: money?.amount ?? null,
          currency: money?.currencyCode || '',
        });
      }
    }
    for (const [childKey, child] of Object.entries(value)) {
      // Related videos, variations, and excluded ASINs are not category members.
      if (['adaptivewidgetProductVideos', 'twisterVariations', 'excludedAsins'].includes(childKey)) continue;
      if (/^asin$/i.test(childKey) && validAsin(child)) asins.add(child);
      walk(child, childKey);
    }
  }
  walk(content);
  const strategy = content.ProductStrategy || content.productStrategy || '';
  const title = typeof content.title === 'string' ? content.title : '';
  // Dynamic carousels are not evidence of curated category membership.
  const recommendation = /carousel/i.test(widget.widgetType || '') ||
    /best.?seller|recommend|you might|recently viewed/i.test(`${title} ${JSON.stringify(strategy)}`);
  return {
    widget_id: widget.widgetId || content.id || '',
    widget_type: widget.widgetType || '',
    title,
    recommendation,
    strategy,
    all_products_returned: content.allProductsReturned ?? null,
    configured_asins: [...asins],
    products: [...products.values()],
  };
}

function expandWidgets(widget) {
  if (!Array.isArray(widget.tiles)) return [normalizeWidget(widget)];
  // Editorial rows store product showcases and shoppable tiles outside `content`.
  return widget.tiles.flatMap((tile, index) => expandWidgets({
    ...tile,
    widgetId: tile.widgetId || `${widget.widgetId}:${index}`,
    widgetType: tile.widgetType || tile.content?.type || tile.type || widget.widgetType,
  }));
}

async function downloadPage(entry) {
  const url = `${origin}/stores/page/${entry.pageId}`;
  const page = await context.newPage();
  try {
    const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000});
    if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'unknown'}`);
    await page.waitForFunction(() => [...document.scripts].some((s) => /var config\s*=\s*\{/.test(s.textContent)), null, {timeout: 15000});
    const extracted = await page.evaluate(extractWidgets);
    const navigation = extracted.widgets.find((w) => w.content?.nav)?.content.nav || {};
    const widgets = extracted.widgets.flatMap(expandWidgets).filter((w) => w.configured_asins.length);
    console.log(`${entry.title}: ${widgets.reduce((n, w) => n + w.configured_asins.length, 0)} product observations`);
    return {
      page_id: entry.pageId,
      title: entry.title,
      parent_id: entry.parent || null,
      url,
      status: 'downloaded',
      parse_errors: extracted.parseErrors,
      widgets,
      navigation,
    };
  } catch (error) {
    console.log(`${entry.title}: ${error.message}`);
    return {page_id: entry.pageId, title: entry.title, parent_id: entry.parent || null, url, status: 'failed', error: error.message, widgets: [], navigation: {}};
  } finally {
    await page.close();
  }
}

function csv(rows, columns) {
  const escape = (value) => {
    let text = value == null ? '' : String(value);
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [columns, ...rows.map((row) => columns.map((key) => row[key]))]
    .map((row) => row.map(escape).join(',')).join('\r\n') + '\r\n';
}

try {
  await mkdir(output, {recursive: true});
  const root = await downloadPage({pageId: rootId, title: 'Sumeet'});
  if (root.status !== 'downloaded' || !Object.keys(root.navigation).length) {
    throw new Error('Could not read brandstore navigation; no complete export was produced.');
  }
  const navigation = root.navigation;
  const entries = Object.values(navigation).filter((entry) => entry.pageId !== rootId);
  const pages = [root];
  // Two workers avoid sending a burst of requests to the public store.
  let next = 0;
  await Promise.all(Array.from({length: 2}, async () => {
    while (next < entries.length) {
      const entry = entries[next++];
      pages.push(await downloadPage(entry));
    }
  }));
  const products = new Map();
  const memberships = new Map();
  const recommendations = new Map();
  for (const page of pages) {
    for (const widget of page.widgets) {
      for (const product of widget.products) {
        const old = products.get(product.asin);
        if (!old || (!old.title && product.title)) products.set(product.asin, product);
      }
      for (const asin of widget.configured_asins) {
        if (!products.has(asin)) products.set(asin, {asin, title: '', product_url: `${origin}/dp/${asin}`, image_url: '', price: null, currency: ''});
        const target = widget.recommendation ? recommendations : memberships;
        target.set(`${page.page_id}:${asin}`, {
          parent_category: navigation[page.parent_id]?.title || '',
          category: page.title,
          page_id: page.page_id,
          page_url: page.url,
          asin,
          source_type: widget.widget_type,
        });
      }
    }
  }
  const enrich = (row) => ({...row, ...products.get(row.asin)});
  const memberRows = [...memberships.values()].map(enrich).sort((a, b) => `${a.parent_category}/${a.category}/${a.asin}`.localeCompare(`${b.parent_category}/${b.category}/${b.asin}`));
  const recommendationRows = [...recommendations.values()].map(enrich);
  const categoryRows = pages.map((p) => ({
    category: p.title,
    parent_category: navigation[p.parent_id]?.title || '',
    page_id: p.page_id,
    page_url: p.url,
    status: p.status,
    products: memberRows.filter((r) => r.page_id === p.page_id).length,
    recommendations: recommendationRows.filter((r) => r.page_id === p.page_id).length,
    error: p.error || p.parse_errors?.join('; ') || '',
  })).sort((a, b) => `${a.parent_category}/${a.category}`.localeCompare(`${b.parent_category}/${b.category}`));
  const memberAsins = new Set(memberRows.map((r) => r.asin));
  const productRows = [...products.values()].filter((p) => memberAsins.has(p.asin)).sort((a, b) => a.asin.localeCompare(b.asin));
  const summary = {
    exported_at: exportedAt,
    source: `${origin}/stores/Sumeet/page/${rootId}`,
    pages_discovered: pages.length,
    pages_downloaded: pages.filter((p) => p.status === 'downloaded').length,
    pages_failed: pages.filter((p) => p.status !== 'downloaded').length,
    unique_curated_asins: productRows.length,
    curated_category_product_pairs: memberRows.length,
    recommendation_pairs_separated: recommendationRows.length,
    missing_titles: productRows.filter((p) => !p.title).length,
    notes: [
      'Public brandstore snapshot, not a complete Amazon seller catalog.',
      'Category membership comes from page widget configuration, not title matching.',
      'Dynamic recommendations/carousels are exported separately and are not category memberships.',
      'All carousel widgets are conservatively separated, including explicitly configured carousels.',
      'Configured ASINs without returned details retain blank titles; they may be unavailable or not loaded by the public page.',
      'Prices are observations at export time, not guaranteed current prices.',
      'Image URLs are recorded; image files are not downloaded.',
      'No Shopify data was changed.',
    ],
  };
  const columns = ['parent_category', 'category', 'asin', 'title', 'product_url', 'image_url', 'price', 'currency', 'source_type', 'page_id', 'page_url'];
  await Promise.all([
    writeFile(resolve(output, 'category-products.csv'), csv(memberRows, columns)),
    writeFile(resolve(output, 'products.csv'), csv(productRows, ['asin', 'title', 'product_url', 'image_url', 'price', 'currency'])),
    writeFile(resolve(output, 'recommendations.csv'), csv(recommendationRows, columns)),
    writeFile(resolve(output, 'categories.csv'), csv(categoryRows, ['parent_category', 'category', 'page_id', 'page_url', 'status', 'products', 'recommendations', 'error'])),
    writeFile(resolve(output, 'brandstore.json'), JSON.stringify({summary, categories: categoryRows, products: productRows, memberships: memberRows, recommendations: recommendationRows, pages: pages.map(({navigation: _, ...page}) => page)}, null, 2) + '\n'),
  ]);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
