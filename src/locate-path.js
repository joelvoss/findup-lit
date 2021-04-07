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

////////////////////////////////////////////////////////////////////////////////

/**
 * checkType tests if a given `type` is valid.
 * @param {string} type
 * @returns
 */
function checkType(type) {
	if (type in typeMappings) return;
	throw new Error(`Invalid type specified: ${type}`);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * matchType tests if a given `type` matches a file or directory type.
 * @param {string} type
 * @param {fs.Stats} stat
 * @returns {boolean}
 */
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

/**
 * locatePath gets the first fulfilled path that is either a directory or file.
 * @param {string[]} paths
 * @param {Object} options
 * @param {string} [options.cwd=process.cwd()]
 * @param {string} [options.type='file']
 * @param {boolean} [options.allowSymlinks=true]
 * @param {number} [options.concurrency=Infinity]
 * @param {boolean} [options.preserveOrder=true]
 * @returns {Promise<string|undefined>}
 * @throws
 */
export async function locatePath(paths, options) {
	options = {
		cwd: process.cwd(),
		type: 'file',
		allowSymlinks: true,
		concurrency: Infinity,
		preserveOrder: true,
		...options,
	};

	checkType(options.type);

	const statFn = options.allowSymlinks ? fsStat : fsLStat;

	const limit = pLimit(options.concurrency);

	// NOTE(joel): Start all the promises concurrently with optional limit.
	const items = [...paths].map(element => [
		element,
		limit(async () => {
			try {
				const stat = await statFn(path.resolve(options.cwd, element));
				return matchType(options.type, stat);
			} catch {
				return false;
			}
		}),
	]);

	// NOTE(joel): Check the promises either serially or concurrently.
	const checkLimit = pLimit(options.preserveOrder ? 1 : Infinity);

	try {
		await Promise.all(
			items.map(element =>
				checkLimit(async () => {
					const values = await Promise.all(element);
					// NOTE(joel): When we found a file, we throw an `EndError` to
					// indicate that we're done.
					if (values[1] === true) {
						throw new EndError(values[0]);
					}
					return false;
				}),
			),
		);
	} catch (error) {
		if (error instanceof EndError) {
			return error.value;
		}

		throw error;
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * locatePathSync gets the first path that is either a directory or file.
 * @param {string[]} paths
 * @param {Object} options
 * @param {string} [options.cwd=process.cwd()]
 * @param {string} [options.type='file']
 * @param {boolean} [options.allowSymlinks=true]
 * @returns {string|undefined}
 */
export function locatePathSync(paths, options) {
	options = {
		cwd: process.cwd(),
		allowSymlinks: true,
		type: 'file',
		...options,
	};

	checkType(options.type);

	const statFn = options.allowSymlinks ? fs.statSync : fs.lstatSync;

	for (const _path of paths) {
		try {
			const stat = statFn(path.resolve(options.cwd, _path));

			if (matchType(options.type, stat)) {
				return _path;
			}
		} catch {}
	}
}
