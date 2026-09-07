import { createServer } from 'node:http';
import { test, expect } from './qa-test.js';

test('local-only mode stops an external redirect before a browser request', async ({ page }) => {
  test.skip(process.env.QA_LOCAL_ONLY !== '1', 'The navigation guard is an explicit local-only control.');
  const server = createServer((_request, response) => {
    response.writeHead(302, { location: 'https://external.invalid/qa-redirect-sentinel' });
    response.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const externalRequests = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://external.invalid/')) externalRequests.push(request.url());
  });
  try {
    await expect(page.goto(`http://127.0.0.1:${server.address().port}/`)).rejects.toThrow();
    expect(externalRequests).toEqual([]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
