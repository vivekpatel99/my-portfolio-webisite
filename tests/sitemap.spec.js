import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('sitemap excludes project URLs until real case studies exist', async () => {
  const sitemap = await readFile('public/sitemap.xml', 'utf8');
  expect(sitemap).not.toContain('/project/');
  expect(sitemap).toContain('https://www.vivekapatel.com/contact');
  expect(sitemap).toContain('https://www.vivekapatel.com/legal');
  expect(sitemap).toContain('https://www.vivekapatel.com/data-policy');
});
