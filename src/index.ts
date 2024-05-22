import path from 'node:path';
import { type PathLike } from 'node:fs';
import {
	type LocatePathOptions,
	type LocatePathSyncOptions,
	locatePath,
	locatePathSync,
} from './locate-path';
import { pathExists, pathExistsSync } from './path-exists';

////////////////////////////////////////////////////////////////////////////////

/**
 * findUpStop can be returned by a matcher function to stop the search and
 * cause `findUp` to immediately return.
 */
export const findUpStop: symbol = Symbol('findUp.stop');

/**
 * findUpExists asynchronously checks if a given `path` (file or directory)
 * exists.
 */
export const findUpExists = pathExists;

/**
 * findUpExistsSync synchronously checks if a given `path` (file or directory)
 * exists.
 */
export const findUpExistsSync = pathExistsSync;

////////////////////////////////////////////////////////////////////////////////

type Name =
	| string
	| string[]
	| ((
			directory: PathLike,
	  ) =>
			| void
			| PathLike
			| typeof findUpStop
			| boolean
			| Promise<void | PathLike | typeof findUpStop | boolean>);
type MatcherOptions = LocatePathOptions & {
	cwd: string;
};

/**
 * findUp walks the directory tree up until it finds the given `name`.
 */
export async function findUp(name: Name, options: LocatePathOptions = {}) {
	let directory = path.resolve(options.cwd || '');
	const { root } = path.parse(directory);

	let paths: string[];
	if (Array.isArray(name)) {
		paths = ([] as string[]).concat(name);
	} else if (typeof name === 'string') {
		paths = [name];
	}

	const runMatcher = async (locateOptions: MatcherOptions) => {
		if (typeof name !== 'function') {
			return locatePath(paths, locateOptions);
		}

		const foundPath = await name(locateOptions.cwd);
		if (typeof foundPath === 'string') {
			return locatePath([foundPath], locateOptions);
		}

		return foundPath;
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const foundPath = await runMatcher({ ...options, cwd: directory });

		if (foundPath === findUpStop) return;
		if (foundPath) return path.resolve(directory, foundPath as string);

		if (directory === root) return;
		directory = path.dirname(directory);
	}
}

////////////////////////////////////////////////////////////////////////////////

type NameSync =
	| string
	| string[]
	| ((directory: PathLike) => void | PathLike | typeof findUpStop | boolean);
type MatcherSyncOptions = LocatePathSyncOptions & {
	cwd: string;
};

/**
 * findUpSync walks the directory tree up until it finds the given `name`.
 */
export function findUpSync(
	name: NameSync,
	options: LocatePathSyncOptions = {},
) {
	let directory = path.resolve(options.cwd || '');
	const { root } = path.parse(directory);

	let paths: string[];
	if (Array.isArray(name)) {
		paths = ([] as string[]).concat(name);
	} else if (typeof name === 'string') {
		paths = [name];
	}

	const runMatcher = (locateOptions: MatcherSyncOptions) => {
		if (typeof name !== 'function') {
			return locatePathSync(paths, locateOptions);
		}

		const foundPath = name(locateOptions.cwd);
		if (typeof foundPath === 'string') {
			return locatePathSync([foundPath], locateOptions);
		}

		return foundPath;
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const foundPath = runMatcher({ ...options, cwd: directory });

		if (foundPath === findUpStop) return;
		if (foundPath) return path.resolve(directory, foundPath as string);

		if (directory === root) return;
		directory = path.dirname(directory);
	}
}
