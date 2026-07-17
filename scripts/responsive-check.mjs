import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const repoRoot = '/home/runner/work/undercutspiky.github.io/undercutspiky.github.io';
const siteRoot = path.join(repoRoot, '_site');
const screenshotRoot = '/tmp/responsive-after';
const baseUrl = 'http://127.0.0.1:4173';
const widths = [320, 390, 768, 1440];
const pages = ['/', '/research', '/blog', '/about'];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  if (filePath.endsWith('.xml')) return 'application/xml; charset=utf-8';
  return 'application/octet-stream';
}

async function resolvePath(requestPath) {
  const cleanPath = decodeURIComponent(requestPath.split('?')[0]);
  const relativePath = cleanPath.replace(/^\//, '');
  const directPath = path.join(siteRoot, relativePath);

  if (cleanPath.endsWith('/')) {
    const indexPath = path.join(directPath, 'index.html');
    if (await exists(indexPath)) return indexPath;
  }

  if (await exists(directPath)) {
    const stat = await fs.stat(directPath);
    if (stat.isFile()) return directPath;
    const indexPath = path.join(directPath, 'index.html');
    if (await exists(indexPath)) return indexPath;
  }

  if (!path.extname(relativePath)) {
    const htmlPath = `${directPath}.html`;
    if (await exists(htmlPath)) return htmlPath;
  }

  return null;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const filePath = await resolvePath(req.url || '/');
      if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const buffer = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      res.end(buffer);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
    }
  });

  return new Promise((resolve) => {
    server.listen(4173, '127.0.0.1', () => resolve(server));
  });
}

async function findGeneratedPage(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (dirs.length === 0) throw new Error(`No directories found under ${dirPath}`);
  return dirs[0];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testOverflow(page, route, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));

  assert(
    result.scrollWidth <= result.innerWidth,
    `Horizontal overflow on ${route} at ${width}px (scrollWidth=${result.scrollWidth}, innerWidth=${result.innerWidth})`
  );

  const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_').replace(/\.html$/, '');
  await page.screenshot({
    path: path.join(screenshotRoot, `${slug}-${width}.png`),
    fullPage: true
  });
}

async function testMobileNav(page) {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  const toggle = page.locator('.nav-toggle');
  await toggle.waitFor({ state: 'visible' });
  assert(await toggle.getAttribute('aria-expanded') === 'false', 'Mobile menu should start closed');

  await toggle.click();
  assert(await toggle.getAttribute('aria-expanded') === 'true', 'Mobile menu did not open');

  await page.keyboard.press('Escape');
  assert(await toggle.getAttribute('aria-expanded') === 'false', 'Escape did not close mobile menu');

  await toggle.click();
  await page.click('#main-content');
  assert(await toggle.getAttribute('aria-expanded') === 'false', 'Outside click did not close mobile menu');

  const linkTargets = [
    { text: 'Research', route: '/research' },
    { text: 'Blog', route: '/blog' },
    { text: 'About', route: '/about' },
    { text: 'Home', route: '/' }
  ];

  for (const target of linkTargets) {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await toggle.click();
    await page.locator('#primary-nav .nav-link', { hasText: target.text }).click();
    await page.waitForURL(`${baseUrl}${target.route}`);
    const expanded = await page.locator('.nav-toggle').getAttribute('aria-expanded');
    assert(expanded === 'false', `Mobile menu did not close after selecting ${target.text}`);
  }
}

async function testDesktopNav(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const desktopVisible = await page.locator('.nav-links').isVisible();
  const toggleVisible = await page.locator('.nav-toggle').isVisible();
  assert(desktopVisible, 'Desktop nav links are not visible at 1440px');
  assert(!toggleVisible, 'Mobile menu button should not be visible at 1440px');
}

async function main() {
  await fs.mkdir(screenshotRoot, { recursive: true });

  const generatedResearch = await findGeneratedPage(path.join(siteRoot, 'research'));
  const years = (await fs.readdir(siteRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  assert(years.length > 0, 'No generated blog year folders found');

  const months = await findGeneratedPage(path.join(siteRoot, years[0]));
  const days = await findGeneratedPage(path.join(siteRoot, years[0], months));
  const postCandidates = (await fs.readdir(path.join(siteRoot, years[0], months, days)))
    .filter((entry) => entry.endsWith('.html'))
    .sort();
  assert(postCandidates.length > 0, 'No generated blog posts found');

  const generatedPost = `/${years[0]}/${months}/${days}/${postCandidates[0]}`;
  pages.push(`/research/${generatedResearch}/`);
  pages.push(generatedPost);

  const server = await startServer();
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const route of pages) {
      for (const width of widths) {
        await testOverflow(page, route, width);
      }
    }

    await testMobileNav(page);
    await testDesktopNav(page);

    await browser.close();
    console.log(`Responsive checks passed. Screenshots saved to ${screenshotRoot}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

await main();
