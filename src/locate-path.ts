import path from 'node:path';
import fs, { type Stats } from 'node:fs';
import * as fsAsync from 'node:fs/promises';
import { pLimit } from 'plimit-lit';

////////////////////////////////////////////////////////////////////////////////

const fsStat = fsAsync.stat;
const fsLStat = fsAsync.lstat;

////////////////////////////////////////////////////////////////////////////////

const typeMappings = {
	directory: 'isDirectory',
	file: 'isFile',
};

////////////////////////////////////////////////////////////////////////////////

/**
 * checkType tests if a given `type` is valid.
 */
function checkType(type?: string) {
	if (type == null || !(type in typeMappings)) {
		throw new Error(`Invalid type specified: ${type}`);
	}
	return;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * matchType tests if a given `type` matches a file or directory type.
 */
function matchType(type: string, stat: Stats) {
	// @ts-expect-error - TS doesn't know that `typeMappings` is a valid key.
	return type === undefined || stat[typeMappings[type]]();
}

////////////////////////////////////////////////////////////////////////////////

class EndError extends Error {
	value: string;
	constructor(value: string) {
		super();
		this.value = value;
	}
}

////////////////////////////////////////////////////////////////////////////////

export type LocatePathOptions = {
	cwd?: string;
	type?: 'file' | 'directory';
	allowSymlinks?: boolean;
	concurrency?: number;
	preserveOrder?: boolean;
};

/**
 * locatePath gets the first fulfilled path that is either a directory or file.
 */
export async function locatePath(paths: string[], options: LocatePathOptions) {
	const opts = {
		cwd: process.cwd(),
		type: 'file',
		allowSymlinks: true,
		concurrency: Infinity,
		preserveOrder: true,
		...options,
	};

	checkType(opts.type);

	const statFn = opts.allowSymlinks ? fsStat : fsLStat;

	const limit = pLimit(opts.concurrency);

	// NOTE(joel): Start all the promises concurrently with optional limit.
	const items = [...paths].map(element => [
		element,
		limit(async () => {
			try {
				const stat = await statFn(path.resolve(opts.cwd, element));
				return matchType(opts.type, stat);
			} catch {
				return false;
			}
		}),
	]);

	// NOTE(joel): Check the promises either serially or concurrently.
	const checkLimit = pLimit(opts.preserveOrder ? 1 : Infinity);

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

export type LocatePathSyncOptions = {
	cwd?: string;
	type?: 'file' | 'directory';
	allowSymlinks?: boolean;
};

/**
 * locatePathSync gets the first path that is either a directory or file.
 */
export function locatePathSync(
	paths: string[],
	options: LocatePathSyncOptions,
) {
	const opts = {
		cwd: process.cwd(),
		allowSymlinks: true,
		type: 'file',
		...options,
	};

	checkType(opts.type);

	const statFn = opts.allowSymlinks ? fs.statSync : fs.lstatSync;

	for (const _path of paths) {
		try {
			const stat = statFn(path.resolve(opts.cwd, _path));

			if (matchType(opts.type, stat)) {
				return _path;
			}
		} catch {
			/* empty */
		}
	}
}
