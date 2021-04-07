import * as fs from 'fs';

/**
 * pathExists asynchronously checks if a given `path` (file or directory)
 * exists.
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export async function pathExists(path) {
	try {
		await fs.promises.access(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * pathExistsSync synchronously checks if a given `path` (file or directory)
 * exists.
 * @param {string} path
 * @returns {boolean}
 */
export function pathExistsSync(path) {
	try {
		fs.accessSync(path);
		return true;
	} catch {
		return false;
	}
}
