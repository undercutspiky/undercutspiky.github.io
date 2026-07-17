import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const repoRoot = '/home/runner/work/undercutspiky.github.io/undercutspiky.github.io';
const siteRoot = path.join(repoRoot, '_site');
const screenshotRoot = '/tmp/responsive-after';
const baseUrl = 'http://127.0.0.1:4173';
const widths = [320, 390, 768, 1440];
const pages = ['/', '/research', '/blog', '/about'];

async function findGeneratedPage(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (dirs.length === 0) throw new Error(`No directories found under ${dirPath}`);
  return dirs[0];
}

function startServer() {
  const server = spawn('python3', ['-m', 'http.server', '4173'], {
    cwd: siteRoot,
    stdio: 'ignore'
  });
  return server;
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) {
      // ignore until server starts
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for local preview server');
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

  const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_');
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
    await page.getByRole('link', { name: target.text }).click();
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

  const server = startServer();
  try {
    await waitForServer(baseUrl);

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
    server.kill('SIGTERM');
  }
}

await main();
