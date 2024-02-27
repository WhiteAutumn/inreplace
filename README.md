# `inreplace`
[![npm](https://img.shields.io/npm/v/inreplace?style=for-the-badge)](https://www.npmjs.com/package/inreplace) [![npm type definitions](https://img.shields.io/npm/types/inreplace?style=for-the-badge)](#) [![npm modules type](https://img.shields.io/badge/modules-hybrid-blue?style=for-the-badge)](#) [![npm bundle size](https://img.shields.io/bundlephobia/min/inreplace?style=for-the-badge)](https://bundlephobia.com/package/inreplace)

## What?
The `inreplace` package provides a function to replace an object in-place with another and the capability to restore it later. It does so by mutating the target object to look like the source object.

## Why?
The packaged was developed with the intention to be used during testing to swap out globals with mocked versions. For example you might want to swap out node's `fs` module with a mocked or in memory file system during testing.

## How?
Like this:
```js
import fs from 'fs/promises';
import inreplace from 'inreplace';

const replacedFs = inreplace(fs, {
  readFile: async () => Buffer.from('asdf1234')
});

const data = await fs.readFile('./some-file')
  .then(it => it.toString());

console.log(data);

replacedFs.restore();
```
This will replace the global `fs/promises` module with the mocked version. Since `inreplace` works by mutating the object, this will take effect across the entire runtime and not just the file it was called in.

It is worth noting that `inreplace` replaces the entire object, meaning any functions you do not include in your mocked version will be undefined.

### Options
You may pass an options object to the `inreplace` functions. The currently available options are:
* `allowNonConfigurable` - By default the `inreplace` function will throw when encountering a non-configurable property in the target object. With this option set to true the function will instead leave those properties untouched.
