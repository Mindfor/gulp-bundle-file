var should = require('chai').should();
var bundle = require('../index');
var gulp = require('gulp');
var insert = require('gulp-insert');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var map = require('map-stream');
var path = require('path');
var fs = require('fs');

function pushTo(array) {
	return map(function (file, cb) {
		array.push(file);
		cb(null, file);
	});
}

var sample2OutputContent = 'function f1() {\n\
}\n\
function f2() {\n\
}\n\
function f3() {\n\
}';

var sample3OutputContent = 'test\n\
function f1() {\n\
}\n\
test\n\
function f2() {\n\
}\n\
test\n\
function f3() {\n\
}';

var sample4OutputContent = 'function f1() {\n\
}\n\
function f2() {\n\
}\n\
function f3() {\n\
}\n\
//# sourceMappingURL=sample.js.map\n';

var sample4OutputMap = '{"version":3,"sources":["file1.js","file2.js","file3.js"],"names":[],"mappings":"AAAA;AACA;ACDA;AACA;ACDA;AACA","file":"sample.js","sourcesContent":["function f1() {\\n}","function f2() {\\n}","function f3() {\\n}"],"sourceRoot":"/source/"}';

describe('#gulp-bundle-file', function() {
	it('files list', function (done) {
		var files = [];
		gulp.src('test/data/sample.js.bundle')
			.pipe(bundle.list())
			.pipe(pushTo(files))
			.on('end', function () {
				files.should.have.length(3);
				path.relative(process.cwd(), files[0].path).should.equal('test/data/file1.js');
				path.relative(process.cwd(), files[1].path).should.equal('test/data/file2.js');
				path.relative(process.cwd(), files[2].path).should.equal('test/data/inside/file3.js');
				done();
			});
	});

	it('files concat', function (done) {
		gulp.src('test/data/sample.js.bundle')
			.pipe(bundle.concat())
			.pipe(gulp.dest('test/output'))
			.on('end', function () {
				var filePath = 'test/output/sample.js';
				fs.existsSync(filePath).should.equal(true);
				fs.readFileSync(filePath, { encoding: 'utf8' }).should.equal(sample2OutputContent);
				done();
			});
	})

	it('files concat with handler', function (done) {
		gulp.src('test/data/sample.js.bundle')
			.pipe(bundle.concat(function (bundleSrc) {
				return bundleSrc.pipe(insert.prepend('test\n'));
			}))
			.pipe(gulp.dest('test/output'))
			.on('end', function () {
				var filePath = 'test/output/sample.js';
				fs.existsSync(filePath).should.equal(true);
				fs.readFileSync(filePath, { encoding: 'utf8' }).should.equal(sample3OutputContent);
				done();
			});
	})
	
	it('files concat with sourcemaps', function (done) {
		gulp.src('test/data/sample.js.bundle')
			.pipe(sourcemaps.init())
			.pipe(bundle.concat())
			.pipe(sourcemaps.write('.'))
			.pipe(gulp.dest('test/output'))
			.on('end', function () {
				var filePath = 'test/output/sample.js';
				var mapsPath = filePath + '.map';
				fs.existsSync(filePath).should.equal(true);
				fs.readFileSync(filePath, { encoding: 'utf8' }).should.equal(sample4OutputContent);
				fs.existsSync(mapsPath).should.equal(true);
				fs.readFileSync(mapsPath, { encoding: 'utf8' }).should.equal(sample4OutputMap);
				done();
			});
	})
	
	it('files list with `!`', function (done) {
		var files = [];
		gulp.src('test/data/sample2.js.bundle')
			.pipe(bundle.list())
			.pipe(pushTo(files))
			.on('end', function () {
				files.should.have.length(2);
				path.relative(process.cwd(), files[0].path).should.equal('test/data/file2.js');
				path.relative(process.cwd(), files[1].path).should.equal('test/data/inside/file3.js');
				done();
			});
	});
	
	it('files list with variable', function (done) {
		var files = [];
		gulp.src('test/data/sample-variable.js.bundle')
			.pipe(bundle.list({
				insidepath: 'inside',
				root: './test/data'
			}))
			.pipe(pushTo(files))
			.on('end', function () {
				files.should.have.length(4);
				path.relative(process.cwd(), files[0].path).should.equal('test/data/file1.js');
				path.relative(process.cwd(), files[1].path).should.equal('test/data/file2.js');
				path.relative(process.cwd(), files[2].path).should.equal('test/data/inside/file3.js');
				path.relative(process.cwd(), files[3].path).should.equal('test/data/file4.js');
				done();
			});
	});
	
	it('error in bundle', function (done) {
		var hasError = false;
		
		function errorHandler(error) {
			if (error.message.startsWith('File not found with singular glob'))
				hasError = true;
			this.emit("end");
		}
		
		gulp.src('test/data/sample-error-notfound.js.bundle')
		 	.pipe(plumber(errorHandler))
		 	.pipe(bundle.list())
			.pipe(gulp.dest('test/output'))
			.on('end', function () {
				if (hasError)
					done();
				else
					done(new Error('File not found error was not thrown'));
			});
	});
	
	it('error in internal bundle', function (done) {
		var hasError = false;
		
		function errorHandler(error) {
			if (error.message.startsWith('File not found with singular glob'))
				hasError = true;
			this.emit("end");
		}
		
		gulp.src('test/data/sample-error-internal.js.bundle')
		 	.pipe(plumber(errorHandler))
		 	.pipe(bundle.list())
			.pipe(gulp.dest('test/output'))
			.on('end', function () {
				if (hasError)
					done();
				else
					done(new Error('File not found error was not thrown'));
			});
	});
});