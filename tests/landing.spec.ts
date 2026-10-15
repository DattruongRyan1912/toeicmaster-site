import { expect, test } from '@playwright/test';

const app = 'https://toeic.truongquocdat.id.vn/';

test('loads without console errors and tells search engines to stay away', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Biết vì sao mình sai');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

for (const width of [1440, 768, 375]) {
  test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('every "try it" button opens the app, and the source links are right', async ({ page }) => {
  await page.goto('/');
  const tries = page.locator('[data-try]');
  await expect(tries).toHaveCount(3);
  for (const link of await tries.all()) expect(await link.getAttribute('href')).toBe(app);
  await expect(page.locator('a[href="https://github.com/DattruongRyan1912/toeic-lab"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://portfolio.truongquocdat.id.vn/projects/toeic-master"]')).toBeVisible();
});

test('every recording and poster loads', async ({ page, request }) => {
  await page.goto('/');
  const videos = page.locator('video');
  await expect(videos).toHaveCount(7);
  for (const video of await videos.all()) {
    expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true);
    expect(await video.getAttribute('playsinline')).not.toBeNull();
    for (const attribute of ['src', 'poster']) {
      const url = await video.getAttribute(attribute);
      const response = await request.get(url!, { headers: { range: 'bytes=0-1023' } });
      expect([200, 206]).toContain(response.status());
    }
  }
});

test('the numbers match the verified figures once counted up', async ({ page }) => {
  await page.goto('/');
  const numbers = page.locator('[data-count]');
  await numbers.first().scrollIntoViewIfNeeded();
  await expect
    .poll(() => numbers.allTextContents(), { timeout: 6000 })
    .toEqual(['241', '698', '12', '27']);
});

test('all content becomes visible while scrolling', async ({ page }) => {
  await page.goto('/');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 450) {
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(80);
  }
  const faintest = () =>
    page.locator('[data-reveal]').evaluateAll((elements) =>
      Math.min(...elements.map((el) => Number(getComputedStyle(el).opacity))),
    );
  await expect.poll(faintest, { timeout: 8000 }).toBeGreaterThan(0.95);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows everything at once, keeps videos still and offers play buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/(^|\s)motion(\s|$)/);
    const opacities = await page.locator('[data-reveal]').evaluateAll((elements) =>
      elements.map((el) => Number(getComputedStyle(el).opacity)),
    );
    expect(Math.min(...opacities)).toBe(1);
    const hero = page.locator('.hero video');
    await page.waitForTimeout(800);
    expect(await hero.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
    await expect(page.locator('.hero .video-play')).toBeVisible();
  });
});

test('the live site sends the noindex header', async ({ request, baseURL }) => {
  test.skip(!baseURL?.startsWith('https://'), 'Only the deployed site sets the header (at the edge nginx).');
  const response = await request.get('/');
  expect(response.headers()['x-robots-tag']).toContain('noindex');
});
