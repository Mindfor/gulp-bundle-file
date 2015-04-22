'use strict';
var path = require('path')
var through2 = require('through2');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var fs = require('vinyl-fs');
var map = require('map-stream');
var sourcemaps = require('gulp-sourcemaps');

var pluginName = 'gulp-bundle-file';

// pushes files from pipe to array
function pushTo(array) {
	return map(function (file, cb) {
		array.push(file);
		cb(null, file);
	});
}

// validates file
function checkFile(file, cb) {
	if (file.isNull()) {
		cb(null, file);
		return false;
	}
	if (file.isStream()) {
		cb(new PluginError(pluginName, 'Streaming not supported'));
		return false;
	}
	return true;
}

// creates new pipe for files from bundle
function processBundleFile(file, bundleExt, bundleHandler) {
	// get paths
	var relative = path.relative(process.cwd(), file.path);
	var dir = path.dirname(relative);

	// get bundle files
	var lines = file.contents.toString().split('\n');
	var resultFilePaths = [];
	lines.forEach(function(line) {
		resultFilePaths.push(path.join(dir, line));
	});

	// find files and send to buffer
	var bundleSrc = fs.src(resultFilePaths)
		.pipe(recursiveBundle(bundleExt));
	if (bundleHandler && typeof bundleHandler === 'function')
		bundleSrc = bundleHandler(bundleSrc);
	return bundleSrc;
}

// recursively processes files and unwraps bundle files
function recursiveBundle(bundleExt) {
	return through2.obj(function(file, enc, cb) {
		if (!checkFile(file, cb))
			return;

		// standart file push to callback
		if (path.extname(file.path).toLowerCase() != bundleExt)
			return cb(null, file);

		// bundle file should be parsed
		processBundleFile(file, bundleExt)
			.pipe(pushTo(this))
			.on('end', cb);
	});
}

module.exports = {
	// addes files from bundle to current pipe
	list: function () {
		return through2.obj(function(file, enc, cb) {
			if (!checkFile(file, cb))
				return;

			var ext = path.extname(file.path).toLowerCase();
			processBundleFile(file, ext)
				.pipe(pushTo(this))
				.on('end', cb);
		});
	},

	// concatenates files from bundle and replaces bundle file in current pipe
	// first parameter is function that handles source stream for each bundle
	concat: function (bundleHandler) {
		return through2.obj(function(file, enc, cb) {
			if (!checkFile(file, cb))
				return;
			
			var ext = path.extname(file.path).toLowerCase();
			var resultFileName = path.basename(file.path, ext);
			
			var bundleFiles = processBundleFile(file, ext, bundleHandler);
			if (file.sourceMap)
				bundleFiles = bundleFiles.pipe(sourcemaps.init());
			bundleFiles
				.pipe(concat(resultFileName))
				.pipe(pushTo(this))
				.on('end', cb);
		});
	}
}