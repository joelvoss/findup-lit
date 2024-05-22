import path from 'node:path';
import { describe, test, expect } from 'vitest';
import { pathExists, pathExistsSync } from '../src/path-exists';

const fixtures = path.resolve(__dirname, 'fixtures');

describe(`pathExists`, () => {
	test('should test a given path', async () => {
		const exists = await pathExists(`${fixtures}/foo.js`);
		const missing = await pathExists(`${fixtures}/missing`);

		expect(exists).toEqual(true);
		expect(missing).toEqual(false);
	});
});

describe(`pathExistsSync`, () => {
	test('should test a given path', () => {
		const exists = pathExistsSync(`${fixtures}/foo.js`);
		const missing = pathExistsSync(`${fixtures}/missing`);

		expect(exists).toEqual(true);
		expect(missing).toEqual(false);
	});
});
