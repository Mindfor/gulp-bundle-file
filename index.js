'use strict';
var path = require('path')
var through2 = require('through2');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
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
		cb(new gutil.PluginError(pluginName, 'Streaming not supported'));
		return false;
	}
	return true;
}

// creates new pipe for files from bundle
function processBundleFile(file, bundleExt, variables, bundleHandler, errorCallback) {
	// get bundle files
	var lines = file.contents.toString().split('\n');
	var resultFilePaths = [];
	lines.forEach(function (line) {
		var filePath = getFilePathFromLine(file, line, variables);
		if (filePath)
			resultFilePaths.push(filePath);
	});

	if (!errorCallback)
		errorCallback = function () { };

	// find files and send to buffer
	var bundleSrc = fs.src(resultFilePaths)
		.on('error', errorCallback) // handle file not found errors
		.pipe(plumber(errorCallback)) // handle other errors inside pipeline 
		.pipe(recursiveBundle(bundleExt, variables, errorCallback));

	if (bundleHandler && typeof bundleHandler === 'function')
		bundleSrc = bundleHandler(bundleSrc);
	return bundleSrc.pipe(plumber.stop());
}

// parses file path from line in bundle file
function getFilePathFromLine(bundleFile, line, variables) {
	// handle variables
	var varRegex = /@{([^}]+)}/;
	var match;
	while (match = line.match(varRegex)) {
		var varName = match[1];
		if (!variables || typeof (variables[varName]) === 'undefined')
			throw new gutil.PluginError(pluginName, bundleFile.path + ': variable "' + varName + '" is not specified');

		var varValue = variables[varName];
		line = line.substr(0, match.index) + varValue + line.substr(match.index + match[0].length);
	}

	if (line === '')
		return null;
	
	// handle `!` negated file paths
	var negative = line[0] === '!';
	if (negative)
		line = line.substr(1);

	// get file path for line
	var filePath;
	if (line.indexOf('./') === 0)
		filePath = path.resolve(bundleFile.cwd, line);
	else
		filePath = path.resolve(bundleFile.base, line);
	
	// return path
	if (negative)
		return '!' + filePath;
	return filePath;
}

// recursively processes files and unwraps bundle files
function recursiveBundle(bundleExt, variables, errorCallback) {
	return through2.obj(function (file, enc, cb) {
		if (!checkFile(file, cb))
			return;

		// standart file push to callback
		if (path.extname(file.path).toLowerCase() != bundleExt)
			return cb(null, file);

		// bundle file should be parsed
		processBundleFile(file, bundleExt, variables, null, errorCallback)
			.pipe(pushTo(this))
			.on('end', cb);
	});
}

module.exports = {
	// addes files from bundle to current pipe
	list: function (variables) {
		return through2.obj(function (file, enc, cb) {
			if (!checkFile(file, cb))
				return;

			var ext = path.extname(file.path).toLowerCase();
			processBundleFile(file, ext, variables, null, cb)
				.pipe(pushTo(this))
				.on('end', cb);
		});
	},

	// concatenates files from bundle and replaces bundle file in current pipe
	// first parameter is function that handles source stream for each bundle
	concat: function (variables, bundleHandler) {
		// handle if bundleHandler specified in first argument
		if (!bundleHandler && typeof (variables) === 'function') {
			bundleHandler = variables;
			variables = null;
		}

		return through2.obj(function (file, enc, cb) {
			if (!checkFile(file, cb))
				return;

			var ext = path.extname(file.path).toLowerCase();
			var resultFileName = path.basename(file.path, ext);

			var bundleFiles = processBundleFile(file, ext, variables, bundleHandler, cb);
			if (file.sourceMap)
				bundleFiles = bundleFiles.pipe(sourcemaps.init());
			bundleFiles
				.pipe(concat(resultFileName))
				.pipe(pushTo(this))
				.on('end', cb);
		});
	}
}
