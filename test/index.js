var should = require('chai').should();
var bundle = require('../index');
var gulp = require('gulp');
var map = require('map-stream');
var path = require('path');
var fs = require('fs');

function pushTo(array) {
	return map(function (file, cb) {
		array.push(file);
		cb(null, file);
	});
}

var sampleOutputContent = 'function f1() {\n\
}\n\
function f2() {\n\
}\n\
function f3() {\n\
}';

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
				fs.readFileSync(filePath, { encoding: 'utf8' }).should.equal(sampleOutputContent);
				done();
			});
	})
});