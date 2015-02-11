'use strict';
var pluginName = 'gulp-bundle-file';
var path = require('path')
var through2 = require('through2');
var byline = require('byline');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var fs = require('vinyl-fs');
var map = require('map-stream');

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
function srcBundleFile(file) {
    // get paths
    var relative = path.relative(process.cwd(), file.path);
    var dir = path.dirname(relative);

    // get bundle files
    var lines = file.contents.toString().split('\n');
    var resultFilePaths = [];
    lines.forEach(function(line) {
        resultFilePaths.push(path.join(dir, line));
    });
    gutil.log(resultFilePaths);

    // find files and send to buffer
    return fs.src(resultFilePaths);
}

// addes files from bundle to current pipe
function listBundleFiles() {
    return through2.obj(function(file, enc, cb) {
        if (!checkFile(file, cb))
            return;

        srcBundleFile(file)
            .pipe(pushTo(this))
            .on('end', cb);
    });
}

// concatenates files from bundle and replaces bundle file in current pipe
function concatBundleFiles() {
    return through2.obj(function(file, enc, cb) {
        if (!checkFile(file, cb))
            return;

        var resultFileName = path.basename(file.path, path.extname(file.path));
        srcBundleFile(file)
            .pipe(concat(resultFileName))
            .pipe(pushTo(this))
            .on('end', cb);
    });
}

module.exports = {
    list: listBundleFiles,
    concat: concatBundleFiles
}