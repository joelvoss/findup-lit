import path from 'node:path';
import { describe, test, expect } from 'vitest';
import { locatePath, locatePathSync } from '../src/locate-path';

const fixtures = path.resolve(__dirname, 'fixtures');

describe(`locatePath`, () => {
	test('should find the first path that exists on disk of multiple paths', async () => {
		expect(
			await locatePath(['noop.foo', 'test.png', 'foo.js', 'baz.js'], {
				cwd: fixtures,
			}),
		).toEqual('foo.js');

		expect(await locatePath(['nonexistant'], { cwd: fixtures })).toEqual(
			undefined,
		);

		expect(await locatePath(['noop', 'file'], { cwd: fixtures })).toEqual(
			'file',
		);

		expect(
			await locatePath(['foo.js'], { cwd: fixtures, type: 'directory' }),
		).toEqual(undefined);

		expect(await locatePath(['foo'], { cwd: fixtures, type: 'file' })).toEqual(
			undefined,
		);

		expect(await locatePath(['foo'], { cwd: fixtures })).toEqual(undefined);

		expect(
			await locatePath(['foo'], { cwd: fixtures, type: 'directory' }),
		).toEqual('foo');
	});

	test('should throw on invalid types', async () => {
		expect(async () => {
			// @ts-expect-error - Testing invalid type
			await locatePath(['foo'], { cwd: fixtures, type: 'imaginary' });
		}).rejects.toThrowError('Invalid type specified: imaginary');

		expect(async () => {
			await locatePath(['foo'], { cwd: fixtures, type: undefined });
		}).rejects.toThrowError('Invalid type specified: undefined');
	});

	if (process.platform !== 'win32') {
		test('should find symlinked paths', async () => {
			expect(
				await locatePath(['file-link', 'file'], {
					cwd: fixtures,
					type: 'file',
				}),
			).toEqual('file-link');

			expect(
				await locatePath(['directory-link', 'file'], {
					cwd: fixtures,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				await locatePath(['directory-link', 'file'], {
					cwd: fixtures,
					type: 'directory',
				}),
			).toEqual('directory-link');

			expect(
				await locatePath(['file-link', 'file'], {
					cwd: fixtures,
					allowSymlinks: false,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				await locatePath(['directory-link', 'file'], {
					cwd: fixtures,
					allowSymlinks: false,
					type: 'directory',
				}),
			).toEqual(undefined);
		});
	}
});

describe(`locatePathSync`, () => {
	test('should find the first path that exists on disk of multiple paths', () => {
		expect(
			locatePathSync(['noop.foo', 'test.png', 'foo.js', 'baz.js'], {
				cwd: fixtures,
			}),
		).toEqual('foo.js');

		expect(locatePathSync(['nonexistant'], { cwd: fixtures })).toEqual(
			undefined,
		);

		expect(locatePathSync(['noop', 'file'], { cwd: fixtures })).toEqual('file');

		expect(
			locatePathSync(['foo.js'], { cwd: fixtures, type: 'directory' }),
		).toEqual(undefined);

		expect(locatePathSync(['foo'], { cwd: fixtures, type: 'file' })).toEqual(
			undefined,
		);

		expect(locatePathSync(['foo'], { cwd: fixtures })).toEqual(undefined);

		expect(
			locatePathSync(['foo'], { cwd: fixtures, type: 'directory' }),
		).toEqual('foo');
	});

	test('should throw on invalid types', () => {
		expect(() => {
			// @ts-expect-error - Testing invalid type
			locatePathSync(['foo'], { cwd: fixtures, type: 'imaginary' });
		}).toThrowError('Invalid type specified: imaginary');

		expect(() => {
			locatePathSync(['foo'], { cwd: fixtures, type: undefined });
		}).toThrowError('Invalid type specified: undefined');
	});

	if (process.platform !== 'win32') {
		test('should find symlinked paths', () => {
			expect(
				locatePathSync(['file-link', 'file'], {
					cwd: fixtures,
					type: 'file',
				}),
			).toEqual('file-link');

			expect(
				locatePathSync(['directory-link', 'file'], {
					cwd: fixtures,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				locatePathSync(['directory-link', 'file'], {
					cwd: fixtures,
					type: 'directory',
				}),
			).toEqual('directory-link');

			expect(
				locatePathSync(['file-link', 'file'], {
					cwd: fixtures,
					allowSymlinks: false,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				locatePathSync(['directory-link', 'file'], {
					cwd: fixtures,
					allowSymlinks: false,
					type: 'directory',
				}),
			).toEqual(undefined);
		});
	}
});
