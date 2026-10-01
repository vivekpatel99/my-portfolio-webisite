// @vitest-environment jsdom

import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import React from 'react';
import tailwindcss from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';
import { afterEach, expect, it } from 'vitest';

import { Toast, ToastAction, ToastProvider, ToastViewport } from './toast';

const tailwindConfigPath = resolve(process.cwd(), 'tailwind.config.js');

afterEach(cleanup);

function collectEmittedClassNames(root) {
	const classNames = new Set();

	root.walkRules((rule) => {
		selectorParser((selectors) => {
			selectors.walkClasses((className) => classNames.add(className.value));
		}).processSync(rule.selector);
	});

	return classNames;
}

it('emits CSS for every destructive ToastAction state', async () => {
	render(
		<ToastProvider>
			<Toast open variant="destructive">
				<ToastAction altText="Undo">Undo</ToastAction>
			</Toast>
			<ToastViewport />
		</ToastProvider>,
	);
	const action = await screen.findByRole('button', { name: 'Undo' });
	const destructiveClasses = [...action.classList].filter((className) =>
		className.startsWith('group-[.destructive]'),
	);

	expect(destructiveClasses.length).toBeGreaterThan(0);

	const tailwindConfig = loadConfig(tailwindConfigPath);
	const result = await postcss([
		tailwindcss({
			...tailwindConfig,
			content: [{ raw: action.outerHTML, extension: 'html' }],
		}),
	]).process('@tailwind utilities;', { from: undefined });
	const emittedClassNames = collectEmittedClassNames(result.root);
	const missingClasses = destructiveClasses.filter(
		(className) => !emittedClassNames.has(className),
	);

	expect(missingClasses).toEqual([]);
});
