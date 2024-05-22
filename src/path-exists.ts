import fs from 'node:fs';
import * as fsAsync from 'node:fs/promises';

/**
 * pathExists asynchronously checks if a given `path` (file or directory)
 * exists.
 */
export async function pathExists(path: string) {
	try {
		await fsAsync.access(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * pathExistsSync synchronously checks if a given `path` (file or directory)
 * exists.
 */
export function pathExistsSync(path: string) {
	try {
		fs.accessSync(path);
		return true;
	} catch {
		return false;
	}
}
