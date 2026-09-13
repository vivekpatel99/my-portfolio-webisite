// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

let server;
let baseUrl;

beforeAll(async () => {
	server = await createServer({
		configFile: fileURLToPath(new URL('../../vite.config.js', import.meta.url)),
		server: { host: '127.0.0.1', port: 0 },
	});
	await server.listen();
	const address = server.httpServer.address();
	baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
	await server?.close();
});

describe('inline edit mode dev module', () => {
	it.each(['/case-studies/', '/contact/'])('serves its config import from %s', async (route) => {
		const pageResponse = await fetch(`${baseUrl}${route}`);
		const pageHtml = await pageResponse.text();

		expect(pageResponse.ok).toBe(true);
		expect(pageResponse.headers.get('content-type')).toContain('text/html');

		const configImport = pageHtml.match(
			/from\s+["'](\/plugins\/visual-editor\/visual-editor-config\.js)["']/,
		)?.[1];
		expect(configImport).toBe('/plugins/visual-editor/visual-editor-config.js');

		const configResponse = await fetch(`${baseUrl}${configImport}`);
		const configSource = await configResponse.text();
		expect(configResponse.ok).toBe(true);
		expect(configResponse.headers.get('content-type')).toContain('text/javascript');
		expect(configSource).toContain('export const POPUP_STYLES');
		expect(configSource).toContain('#inline-editor-popup');
	});
});
