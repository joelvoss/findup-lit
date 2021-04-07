const fixtures = require('fixturez');
const f = fixtures(__dirname);

describe(`locatePath`, () => {
	const { locatePath } = require('../src/locate-path');
	let fixturePath = f.find('fixtures');

	it('should find the first path that exists on disk of multiple paths', async () => {
		expect(
			await locatePath(['noop.foo', 'test.png', 'foo.js', 'baz.js'], {
				cwd: fixturePath,
			}),
		).toEqual('foo.js');

		expect(await locatePath(['nonexistant'], { cwd: fixturePath })).toEqual(
			undefined,
		);

		expect(await locatePath(['noop', 'file'], { cwd: fixturePath })).toEqual(
			'file',
		);

		expect(
			await locatePath(['foo.js'], { cwd: fixturePath, type: 'directory' }),
		).toEqual(undefined);

		expect(
			await locatePath(['foo'], { cwd: fixturePath, type: 'file' }),
		).toEqual(undefined);

		expect(await locatePath(['foo'], { cwd: fixturePath })).toEqual(undefined);

		expect(
			await locatePath(['foo'], { cwd: fixturePath, type: 'directory' }),
		).toEqual('foo');
	});

	it('should throw on invalid types', async () => {
		expect(async () => {
			await locatePath(['foo'], { cwd: fixturePath, type: 'imaginary' });
		}).rejects.toThrowError('Invalid type specified: imaginary');

		expect(async () => {
			await locatePath(['foo'], { cwd: fixturePath, type: undefined });
		}).rejects.toThrowError('Invalid type specified: undefined');
	});

	if (process.platform !== 'win32') {
		it('should find symlinked paths', async () => {
			expect(
				await locatePath(['file-link', 'file'], {
					cwd: fixturePath,
					type: 'file',
				}),
			).toEqual('file-link');

			expect(
				await locatePath(['directory-link', 'file'], {
					cwd: fixturePath,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				await locatePath(['directory-link', 'file'], {
					cwd: fixturePath,
					type: 'directory',
				}),
			).toEqual('directory-link');

			expect(
				await locatePath(['file-link', 'file'], {
					cwd: fixturePath,
					allowSymlinks: false,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				await locatePath(['directory-link', 'file'], {
					cwd: fixturePath,
					allowSymlinks: false,
					type: 'directory',
				}),
			).toEqual(undefined);
		});
	}
});

describe(`locatePathSync`, () => {
	const { locatePathSync } = require('../src/locate-path');
	let fixturePath = f.find('fixtures');

	it('should find the first path that exists on disk of multiple paths', () => {
		expect(
			locatePathSync(['noop.foo', 'test.png', 'foo.js', 'baz.js'], {
				cwd: fixturePath,
			}),
		).toEqual('foo.js');

		expect(locatePathSync(['nonexistant'], { cwd: fixturePath })).toEqual(
			undefined,
		);

		expect(locatePathSync(['noop', 'file'], { cwd: fixturePath })).toEqual(
			'file',
		);

		expect(
			locatePathSync(['foo.js'], { cwd: fixturePath, type: 'directory' }),
		).toEqual(undefined);

		expect(
			locatePathSync(['foo'], { cwd: fixturePath, type: 'file' }),
		).toEqual(undefined);

		expect(locatePathSync(['foo'], { cwd: fixturePath })).toEqual(undefined);

		expect(
			locatePathSync(['foo'], { cwd: fixturePath, type: 'directory' }),
		).toEqual('foo');
	});

	it('should throw on invalid types', () => {
		expect(() => {
			locatePathSync(['foo'], { cwd: fixturePath, type: 'imaginary' });
		}).toThrowError('Invalid type specified: imaginary');

		expect(() => {
			locatePathSync(['foo'], { cwd: fixturePath, type: undefined });
		}).toThrowError('Invalid type specified: undefined');
	});

	if (process.platform !== 'win32') {
		it('should find symlinked paths', () => {
			expect(
				locatePathSync(['file-link', 'file'], {
					cwd: fixturePath,
					type: 'file',
				}),
			).toEqual('file-link');

			expect(
				locatePathSync(['directory-link', 'file'], {
					cwd: fixturePath,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				locatePathSync(['directory-link', 'file'], {
					cwd: fixturePath,
					type: 'directory',
				}),
			).toEqual('directory-link');

			expect(
				locatePathSync(['file-link', 'file'], {
					cwd: fixturePath,
					allowSymlinks: false,
					type: 'file',
				}),
			).toEqual('file');

			expect(
				locatePathSync(['directory-link', 'file'], {
					cwd: fixturePath,
					allowSymlinks: false,
					type: 'directory',
				}),
			).toEqual(undefined);
		});
	}
});
