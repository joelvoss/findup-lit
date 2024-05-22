import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import {
	findUp,
	findUpSync,
	findUpStop,
	findUpExists,
	findUpExistsSync,
} from '../src/index';

////////////////////////////////////////////////////////////////////////////////

const cwd = __dirname;
const fixturePath = path.resolve(__dirname, 'fixtures');
const packageRoot = cwd.replace('/tests', '/');
const isWindows = process.platform === 'win32';

////////////////////////////////////////////////////////////////////////////////

function isPathInside(childPath, parentPath) {
	const relation = path.relative(parentPath, childPath);
	return Boolean(
		relation &&
			relation !== '..' &&
			!relation.startsWith(`..${path.sep}`) &&
			relation !== path.resolve(childPath),
	);
}

function copyFixture(name) {
	const temporaryDirectory = fs.realpathSync(os.tmpdir());
	const dest = path.join(temporaryDirectory, name);
	const from = path.join(fixturePath, name);
	fs.cpSync(from, dest, { recursive: true });
	return dest;
}

////////////////////////////////////////////////////////////////////////////////

describe(`findup`, () => {
	test(`should find a child file`, async () => {
		const p = await findUp('package.json');
		expect(p).toEqual(path.join(packageRoot, 'package.json'));
	});

	test(`should find a child directory`, async () => {
		const p = await findUp('src', { type: 'directory' });
		expect(p).toEqual(path.join(packageRoot, 'src'));
	});

	test(`should explicitly find a child file by 'type: file'`, async () => {
		const f = await findUp('package.json', { type: 'file' });
		expect(f).toEqual(path.join(packageRoot, 'package.json'));

		const d = await findUp('package.json', { type: 'directory' });
		expect(d).toEqual(undefined);
	});

	if (!isWindows) {
		test(`should find a symbolic link (file and directory)`, async () => {
			let p = await findUp('file-link', { cwd: fixturePath });
			expect(p).toEqual(`${fixturePath}/file-link`);

			p = await findUp('file-link', { cwd: fixturePath, allowSymlinks: false });
			expect(p).toEqual(undefined);

			p = await findUp('directory-link', {
				cwd: fixturePath,
				type: 'directory',
			});
			expect(p).toEqual(`${fixturePath}/directory-link`);

			p = await findUp('directory-link', {
				cwd: fixturePath,
				type: 'directory',
				allowSymlinks: false,
			});
			expect(p).toEqual(undefined);
		});
	}

	test(`should find a child file with a custom 'cwd'`, async () => {
		const p = await findUp('baz.js', { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a child file with a custom 'cwd' (array as parameter)`, async () => {
		const p = await findUp(['baz.js'], { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find the first child file with a custom 'cwd' (array as parameter)`, async () => {
		const p = await findUp(['foo.js', 'baz.js'], { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/foo.js`);
	});

	test(`should find the second child file with a custom 'cwd' (array as parameter)`, async () => {
		const p = await findUp(['unknown', 'baz.js'], { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a child directory with a custom 'cwd'`, async () => {
		const p = await findUp('foo', { cwd: fixturePath, type: 'directory' });
		expect(p).toEqual(`${fixturePath}/foo`);
	});

	test(`should find parent file with a custom 'cwd'`, async () => {
		const p = await findUp('baz.js', { cwd: `${fixturePath}/foo/bar` });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a nested descendant file`, async () => {
		const p = await findUp('tests/fixtures/baz.js');
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a nested descendant directory`, async () => {
		const p = await findUp('tests/fixtures/foo', { type: 'directory' });
		expect(p).toEqual(`${fixturePath}/foo`);
	});

	test(`should find a nested descendant directory with a custom 'cwd'`, async () => {
		const p = await findUp('tests/fixtures/foo/bar', {
			cwd: 'node_modules',
			type: 'directory',
		});
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should find a nested cousin directory with a custom 'cwd'`, async () => {
		const p = await findUp('tests/fixtures/foo/bar', {
			cwd: 'tests',
			type: 'directory',
		});
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should find an ancestor directory with a custom 'cwd'`, async () => {
		const p = await findUp('tests', {
			cwd: 'tests/fixtures/foo/bar',
			type: 'directory',
		});
		expect(p).toEqual(`${packageRoot}tests`);
	});

	test(`should find a directory by an absolute path`, async () => {
		const p = await findUp(`${fixturePath}/foo/bar`, { type: 'directory' });
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should not find a file by an absolute path`, async () => {
		const p = await findUp(path.resolve('somenonexistentfile.js'));
		expect(p).toEqual(undefined);
	});

	test(`should find a directory by an absolute path with a disjoint 'cwd'`, async () => {
		const tmpPath = copyFixture('foo');
		const p = await findUp(`${fixturePath}/foo/bar`, {
			cwd: tmpPath,
			type: 'directory',
		});
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should not find a file`, async () => {
		const p = await findUp('somenonexistentfile.js');
		expect(p).toEqual(undefined);
	});

	test(`should not find a file with a disjoint 'cwd'`, async () => {
		const tmpPath = copyFixture('foo');
		const p = await findUp('package.json', { cwd: tmpPath });
		expect(p).toEqual(undefined);
	});

	test(`should find a file/directory by a matcher function`, async () => {
		const cwd = process.cwd();

		let p = await findUp(
			directory => {
				expect(directory).toEqual(cwd);
				return directory;
			},
			{ type: 'directory' },
		);
		expect(p).toEqual(cwd);

		p = await findUp(() => '.', { type: 'directory' });
		expect(p).toEqual(cwd);

		p = await findUp(async () => 'package.json');
		expect(p).toEqual(path.join(cwd, 'package.json'));

		p = await findUp(() => '..', { type: 'directory' });
		expect(p).toEqual(path.join(cwd, '..'));

		p = await findUp(directory => directory !== cwd && directory, {
			type: 'directory',
		});
		expect(p).toEqual(path.join(cwd, '..'));

		p = await findUp(directory => directory === cwd && 'package.json', {
			cwd: fixturePath,
		});
		expect(p).toEqual(`${packageRoot}package.json`);
	});

	test(`should not find a file/directory by a matcher function`, async () => {
		const cwd = process.cwd();
		const { root } = path.parse(cwd);
		const visited = new Set();

		const p = await findUp(async directory => {
			expect(typeof directory).toEqual('string');
			const stat = await promisify(fs.stat)(directory);
			expect(stat.isDirectory()).toEqual(true);
			expect(directory === cwd || isPathInside(cwd, directory)).toEqual(true);
			expect(visited.has(directory)).toEqual(false);
			visited.add(directory);
		});

		expect(p).toEqual(undefined);

		expect(visited.has(cwd)).toEqual(true);
		expect(visited.has(root)).toEqual(true);
	});

	test('should throw when the matcher function throws', async () => {
		const cwd = process.cwd();
		const visited = new Set();

		try {
			await findUp(directory => {
				visited.add(directory);
				throw new Error('A sync error');
			});
		} catch (e) {
			expect(e.message).toEqual('A sync error');
		}

		expect(visited.has(cwd)).toEqual(true);
		expect(visited.size).toEqual(1);
	});

	test('should throw when the matcher function rejects', async () => {
		const cwd = process.cwd();
		const visited = new Set();

		try {
			await findUp(async directory => {
				visited.add(directory);
				throw new Error('An async error');
			});
		} catch (e) {
			expect(e.message).toEqual('An async error');
		}

		expect(visited.has(cwd)).toEqual(true);
		expect(visited.size).toEqual(1);
	});

	test(`should stop early if the matcher function returns the 'stop' symbol`, async () => {
		const cwd = process.cwd();
		const visited = new Set();

		const p = await findUp(async directory => {
			visited.add(directory);
			return findUpStop;
		});

		expect(p).toEqual(undefined);
		expect(visited.has(cwd)).toEqual(true);
		expect(visited.size).toEqual(1);
	});

	test('should check if a path exists', async () => {
		if (!isWindows) {
			let d = await findUpExists(`${fixturePath}/directory-link`);
			expect(d).toEqual(true);
			let f = await findUpExists(`${fixturePath}/file-link`);
			expect(f).toEqual(true);
		}

		let p = await findUpExists(`${fixturePath}/foo/bar`);
		expect(p).toEqual(true);

		p = await findUpExists(`${packageRoot}/package.json`);
		expect(p).toEqual(true);

		p = await findUpExists(`${fixturePath}/fake`);
		expect(p).toEqual(false);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe(`findUpSync`, () => {
	test(`should find a child file`, () => {
		const p = findUpSync('package.json');
		expect(p).toEqual(path.join(packageRoot, 'package.json'));
	});

	test(`should find a child directory`, () => {
		const p = findUpSync('src', { type: 'directory' });
		expect(p).toEqual(path.join(packageRoot, 'src'));
	});

	test(`should explicitly find a child file by 'type: file'`, () => {
		const f = findUpSync('package.json', { type: 'file' });
		expect(f).toEqual(path.join(packageRoot, 'package.json'));

		const d = findUpSync('package.json', { type: 'directory' });
		expect(d).toEqual(undefined);
	});

	if (!isWindows) {
		test(`should find a symbolic link (file and directory)`, () => {
			let p = findUpSync('file-link', { cwd: fixturePath });
			expect(p).toEqual(`${fixturePath}/file-link`);

			p = findUpSync('file-link', { cwd: fixturePath, allowSymlinks: false });
			expect(p).toEqual(undefined);

			p = findUpSync('directory-link', {
				cwd: fixturePath,
				type: 'directory',
			});
			expect(p).toEqual(`${fixturePath}/directory-link`);

			p = findUpSync('directory-link', {
				cwd: fixturePath,
				type: 'directory',
				allowSymlinks: false,
			});
			expect(p).toEqual(undefined);
		});
	}

	test(`should find a child file with a custom 'cwd'`, () => {
		const p = findUpSync('baz.js', { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a child file with a custom 'cwd' (array as parameter)`, () => {
		const p = findUpSync(['baz.js'], { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find the first child file with a custom 'cwd' (array as parameter)`, () => {
		const p = findUpSync(['foo.js', 'baz.js'], { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/foo.js`);
	});

	test(`should find the second child file with a custom 'cwd' (array as parameter)`, () => {
		const p = findUpSync(['unknown', 'baz.js'], { cwd: fixturePath });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a child directory with a custom 'cwd'`, () => {
		const p = findUpSync('foo', { cwd: fixturePath, type: 'directory' });
		expect(p).toEqual(`${fixturePath}/foo`);
	});

	test(`should find parent file with a custom 'cwd'`, () => {
		const p = findUpSync('baz.js', { cwd: `${fixturePath}/foo/bar` });
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a nested descendant file`, () => {
		const p = findUpSync('tests/fixtures/baz.js');
		expect(p).toEqual(`${fixturePath}/baz.js`);
	});

	test(`should find a nested descendant directory`, () => {
		const p = findUpSync('tests/fixtures/foo', { type: 'directory' });
		expect(p).toEqual(`${fixturePath}/foo`);
	});

	test(`should find a nested descendant directory with a custom 'cwd'`, () => {
		const p = findUpSync('tests/fixtures/foo/bar', {
			cwd: 'node_modules',
			type: 'directory',
		});
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should find a nested cousin directory with a custom 'cwd'`, () => {
		const p = findUpSync('tests/fixtures/foo/bar', {
			cwd: 'tests',
			type: 'directory',
		});
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should find an ancestor directory with a custom 'cwd'`, () => {
		const p = findUpSync('tests', {
			cwd: 'tests/fixtures/foo/bar',
			type: 'directory',
		});
		expect(p).toEqual(`${packageRoot}tests`);
	});

	test(`should find a directory by an absolute path`, () => {
		const p = findUpSync(`${fixturePath}/foo/bar`, { type: 'directory' });
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should not find a file by an absolute path`, () => {
		const p = findUpSync(path.resolve('somenonexistentfile.js'));
		expect(p).toEqual(undefined);
	});

	test(`should find a directory by an absolute path with a disjoint 'cwd'`, () => {
		const tmpPath = copyFixture('foo');
		const p = findUpSync(`${fixturePath}/foo/bar`, {
			cwd: tmpPath,
			type: 'directory',
		});
		expect(p).toEqual(`${fixturePath}/foo/bar`);
	});

	test(`should not find a file`, () => {
		const p = findUpSync('somenonexistentfile.js');
		expect(p).toEqual(undefined);
	});

	test(`should not find a file with a disjoint 'cwd'`, () => {
		const tmpPath = copyFixture('foo');
		const p = findUpSync('package.json', { cwd: tmpPath });
		expect(p).toEqual(undefined);
	});

	test(`should find a file/directory by a matcher function`, () => {
		const cwd = process.cwd();

		let p = findUpSync(
			directory => {
				expect(directory).toEqual(cwd);
				return directory;
			},
			{ type: 'directory' },
		);
		expect(p).toEqual(cwd);

		p = findUpSync(() => '.', { type: 'directory' });
		expect(p).toEqual(cwd);

		p = findUpSync(() => 'package.json');
		expect(p).toEqual(path.join(cwd, 'package.json'));

		p = findUpSync(() => '..', { type: 'directory' });
		expect(p).toEqual(path.join(cwd, '..'));

		p = findUpSync(directory => directory !== cwd && directory, {
			type: 'directory',
		});
		expect(p).toEqual(path.join(cwd, '..'));

		p = findUpSync(directory => directory === cwd && 'package.json', {
			cwd: fixturePath,
		});
		expect(p).toEqual(`${packageRoot}package.json`);
	});

	test(`should not find a file/directory by a matcher function`, () => {
		const cwd = process.cwd();
		const { root } = path.parse(cwd);
		const visited = new Set();

		const p = findUpSync(directory => {
			expect(typeof directory).toEqual('string');
			const stat = fs.statSync(directory);
			expect(stat.isDirectory()).toEqual(true);
			expect(directory === cwd || isPathInside(cwd, directory)).toEqual(true);
			expect(visited.has(directory)).toEqual(false);
			visited.add(directory);
		});

		expect(p).toEqual(undefined);

		expect(visited.has(cwd)).toEqual(true);
		expect(visited.has(root)).toEqual(true);
	});

	test('should throw when the matcher function throws', () => {
		const cwd = process.cwd();
		const visited = new Set();

		try {
			findUpSync(directory => {
				visited.add(directory);
				throw new Error('A sync error');
			});
		} catch (e) {
			expect(e.message).toEqual('A sync error');
		}

		expect(visited.has(cwd)).toEqual(true);
		expect(visited.size).toEqual(1);
	});

	test(`should stop early if the matcher function returns the 'stop' symbol`, () => {
		const cwd = process.cwd();
		const visited = new Set();

		const p = findUpSync(directory => {
			visited.add(directory);
			return findUpStop;
		});

		expect(p).toEqual(undefined);
		expect(visited.has(cwd)).toEqual(true);
		expect(visited.size).toEqual(1);
	});

	test('should check if a path exists', () => {
		if (!isWindows) {
			let d = findUpExistsSync(`${fixturePath}/directory-link`);
			expect(d).toEqual(true);
			let f = findUpExistsSync(`${fixturePath}/file-link`);
			expect(f).toEqual(true);
		}

		let p = findUpExistsSync(`${fixturePath}/foo/bar`);
		expect(p).toEqual(true);

		p = findUpExistsSync(`${packageRoot}/package.json`);
		expect(p).toEqual(true);

		p = findUpExistsSync(`${fixturePath}/fake`);
		expect(p).toEqual(false);
	});
});
