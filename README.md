# findup-lit

This package finds a file or directory by walking up parent directories.

## Installation

```bash
$ npm i findup-lit
# or
$ yarn add findup-lit
```

## Usage

```text
fixtures
|-- baz.js
|-- directory-link -> .
|-- file
|-- file-link -> file
|-- foo
|   `-- bar
`-- foo.js
```

```js
import path from 'path';
import { findUp, findUpExists } from 'findup-lit';

(async () => {
	console.log(await findUp('foo.js'));
	// -> '/fixtures/foo.js'

	console.log(await findUp(['foo.js', 'baz.js']));
	// -> '/fixtures/foo.js'

	console.log(
		await findUp(
			async directory => {
				const hasFoo = await findUpExists(path.join(directory, 'foo.js'));
				return hasFoo && directory;
			},
			{ type: 'directory' },
		),
	);
	// -> '/fixtures'
})();
```

## API

### `findUp(matcher, options?)` / `findUpSync(matcher, options?)`

Returns a `Promise<string|undefined>` (async mode) for either the first path
found (by respecting the order of the array if `matcher` is of type `string[]`)
or `undefined` if none could be found.

In sync mode the promise is omitted and `findUpSync` returns either a `string`
or `undefined`.

#### `matcher`

Type: `string | string[] | (directory: string) => string|null`

Either the name of the file or directory to find, an array of files or
directories to find or a function that will be called with each directory until
it returns a string with the path, which stops the search, or the root
directory has been reached and nothing was found.

> Useful if you want to match files with certain patterns, set of permissions,
> or other advanced use-cases.

> **Note:** When using async mode, the matcher may optionally be an async or
> promise-returning function that returns the path.


#### `options`

Type: `Object`

##### `cwd`

Type: `string` \
Default: `process.cwd()`

Current working directory that is being used to start searching from.

##### `type`

Type: `string` \
Default: `'file'` \
Values: `'file' | 'directory'`

The type of a matching path. This can either be `file` or `directory`.

##### `allowSymlinks`

Type: `boolean`
Default: `true`

Allow or disallow symbolic links to match if they point to the chosen path type.

### `findUpExists(path)` / `findUpExistsSync(path)`

Returns a `Promise<boolean>` (async mode) or a `boolean` of whether the path
exists.

#### `path`

Type: `string`

The path to a file or directory.

### `findUpStop`

A `Symbol` that can be returned by a matcher function to stop the search and
cause `findUp`/`findUpSync` to immediately return `undefined`. Useful as a
performance optimization in case the current working directory is deeply
nested in the filesystem.

```js
import path from 'path';
import { findUp, findUpStop } from 'findup-lit';

(async () => {
	await findUp(directory => {
		return path.basename(directory) === 'work' ? findUpStop : 'foo.js';
	});
})();
```

## Development

(1) Install dependencies

```bash
$ npm i
# or
$ yarn
```

(2) Run initial validation

```bash
$ ./Taskfile.sh validate
```

(3) Start developing. See [`./Taskfile.sh`](./Taskfile.sh) for more tasks to
help you develop.
