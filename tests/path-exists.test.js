const fixtures = require('fixturez');
const f = fixtures(__dirname);

describe(`pathExists`, () => {
	const { pathExists } = require('../src/path-exists');
	let fixturePath = f.find('fixtures');

	it('should test a given path', async () => {
		const exists = await pathExists(`${fixturePath}/foo.js`);
		const missing = await pathExists(`${fixturePath}/missing`);

		expect(exists).toEqual(true);
		expect(missing).toEqual(false);
	});
});

describe(`pathExistsSync`, () => {
	const { pathExistsSync } = require('../src/path-exists');
	let fixturePath = f.find('fixtures');

	it('should test a given path', () => {
		const exists = pathExistsSync(`${fixturePath}/foo.js`);
		const missing = pathExistsSync(`${fixturePath}/missing`);

		expect(exists).toEqual(true);
		expect(missing).toEqual(false);
	});
});
