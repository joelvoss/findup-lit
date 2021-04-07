import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { pLimit } from 'plimit-lit';

////////////////////////////////////////////////////////////////////////////////

const fsStat = promisify(fs.stat);
const fsLStat = promisify(fs.lstat);

////////////////////////////////////////////////////////////////////////////////

const typeMappings = {
	directory: 'isDirectory',
	file: 'isFile',
};

function checkType({ type }) {
	if (type in typeMappings) return;
	throw new Error(`Invalid type specified: ${type}`);
}

function matchType(type, stat) {
	return type === undefined || stat[typeMappings[type]]();
}

////////////////////////////////////////////////////////////////////////////////

class EndError extends Error {
	constructor(value) {
		super();
		this.value = value;
	}
}

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): The input can also be a promise, so we await it
const testElement = async (element, tester) => tester(await element);

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): The input can also be a promise, so we `Promise.all()` them both.
const finder = async element => {
	const values = await Promise.all(element);
	if (values[1] === true) {
		throw new EndError(values[0]);
	}

	return false;
};

////////////////////////////////////////////////////////////////////////////////

export async function locatePath(paths, options) {
	options = {
		cwd: process.cwd(),
		type: 'file',
		allowSymlinks: true,
		concurrency: Infinity,
		preserveOrder: true,
		...options,
	};

	checkType(options);

	const statFn = options.allowSymlinks ? fsStat : fsLStat;

	const limit = pLimit(options.concurrency);

	// NOTE(joel): Start all the promises concurrently with optional limit.
	const items = [...paths].map(element => [
		element,
		limit(testElement, element, async _path => {
			try {
				const stat = await statFn(path.resolve(options.cwd, _path));
				return matchType(options.type, stat);
			} catch {
				return false;
			}
		}),
	]);

	// NOTE(joel): Check the promises either serially or concurrently.
	const checkLimit = pLimit(options.preserveOrder ? 1 : Infinity);

	try {
		// NOTE(joel): When the `finder` function has found a file, it throws
		// an `EndError` to indicate that we're done.
		await Promise.all(items.map(element => checkLimit(finder, element)));
	} catch (error) {
		if (error instanceof EndError) {
			return error.value;
		}

		throw error;
	}
}

////////////////////////////////////////////////////////////////////////////////

export function locatePathSync(paths, options) {
	options = {
		cwd: process.cwd(),
		allowSymlinks: true,
		type: 'file',
		...options,
	};

	checkType(options);

	const statFn = options.allowSymlinks ? fs.statSync : fs.lstatSync;

	for (const path_ of paths) {
		try {
			const stat = statFn(path.resolve(options.cwd, path_));

			if (matchType(options.type, stat)) {
				return path_;
			}
		} catch {}
	}
}
