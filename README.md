# Information

Package      | gulp-concat
-------------|------------
Description  | Concatenate files specified in `.bundle` file.
Node Version | >= 0.10

# Usage

Next code will concatenate files specified in `.bundle` files. Output files will have name without `.bundle` extension.

```JavaScript
var bundle = require('gulp-bundle-file');

gulp.task('bundles', function() {
	return gulp.src('./bundles/*.bundle')
		.pipe(bundle.concat()) // concat files in each bundles
		.pipe(gulp.dest('./dist/'));
});
```

Lines inside `.bundle` file may contain variables like `@{myVar}`:

```JavaScript
var bundle = require('gulp-bundle-file');

gulp.task('bundles', function() {
	return gulp.src('./bundles/*.bundle')
		.pipe(bundle.concat({ // here should be specified variable values
			myVar1: 'directory/subDirectory',
			myVar2: 'another-dir'
		})) // concat files in each bundles
		.pipe(gulp.dest('./dist/'));
});
```

You can process files specified in each `.bundle` with handler:

```JavaScript
var bundle = require('gulp-bundle-file');
var less = require('gulp-less');

gulp.task('bundles', function() {
	return gulp.src('./bundles/*.bundle')
		.pipe(bundle.concat(function (bundleSrc) {
			return bundleSrc.pipe(less()); // process files with less before thay will be concated
		}))
		.pipe(gulp.dest('./dist/'));
});
```

Another function `bundle.list()` will send files from bundle into pipe:

```JavaScript
var bundle = require('gulp-bundle-file');
var uglify = require('gulp-uglify');

gulp.task('bundles', function() {
	return gulp.src('./bundles/*.js.bundle')
		.pipe(bundle.list()) // lists files in all bundles
		.pipe(uglify()) // send all js file to uglify module
		.pipe(gulp.dest('./dist/'));
});
```

# Bundle file example

If `test.js.bundle` contains text:
```
file1.js
some-dir/file2.js
my-dir/another-bundle.js.bundle
```

... and file `another-bundle.js.bundle` contains text:
```
file3.js
```

... then output file will have name `test.js` with content of `file1.js` + `file2.js` + `file3.js`.

Bundle file with variables:
```
@{myVar1}/subpath/*.js
directory/@{myVar2}/**.js
```
