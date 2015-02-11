# Information

Package      | gulp-concat
-------------|------------
Description  | Concatenates files specified in `.bundle` file.
Node Version | >= 0.10

# Usage

Next code will concat files specified in `*.bundle` files. Output files will have name without `.bundle` extension.

```JavaScript
var bundle = require('gulp-bundle-file');

gulp.task('bundles', function() {
	return gulp.src('./bundles/*.bundle')
		.pipe(bundle.concat()) // concat files in each bundles
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

# Example

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