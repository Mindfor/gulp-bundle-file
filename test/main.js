var bundle = require('../');
var gulp = require('gulp');
var gutil = require('gulp-util');
var debug = require('gulp-debug');

function test1() {
    gutil.log("Test list:");
    return gulp.src('test/data/sample.js.bundle')
        .pipe(bundle.list())
        .pipe(debug());
}

function test2() {
    gutil.log("Test concat:");
    return gulp.src('test/data/sample.js.bundle')
        .pipe(bundle.concat())
        .pipe(debug())
        .pipe(gulp.dest('test/output'));
}

test1();