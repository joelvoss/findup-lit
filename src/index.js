import * as path from 'path';
import { locatePath, locatePathSync } from './locate-path';
import { pathExists, pathExistsSync } from './path-exists';

////////////////////////////////////////////////////////////////////////////////

export const findUpStop = Symbol('findUp.stop');
export const findUpExists = pathExists;
export const findUpExistsSync = pathExistsSync;

////////////////////////////////////////////////////////////////////////////////

export async function findUp(name, options = {}) {
	let directory = path.resolve(options.cwd || '');
	const { root } = path.parse(directory);
	const paths = [].concat(name);

	const runMatcher = async locateOptions => {
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

		if (foundPath === findUpStop) {
			return;
		}

		if (foundPath) {
			return path.resolve(directory, foundPath);
		}

		if (directory === root) {
			return;
		}

		directory = path.dirname(directory);
	}
}

////////////////////////////////////////////////////////////////////////////////

export function findUpSync(name, options = {}) {
	let directory = path.resolve(options.cwd || '');
	const { root } = path.parse(directory);
	const paths = [].concat(name);

	const runMatcher = locateOptions => {
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

		if (foundPath === findUpStop) {
			return;
		}

		if (foundPath) {
			return path.resolve(directory, foundPath);
		}

		if (directory === root) {
			return;
		}

		directory = path.dirname(directory);
	}
}
