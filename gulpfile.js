
var PROJECT_NAME = "GoRaspi";

var gulp = require('gulp'),
	plumber = require('gulp-plumber'),	//Better error handling
	concat = require('gulp-concat'),
	jshint = require('gulp-jshint'),
	ngAnnotate = require('gulp-ng-annotate'), //Prepare angular for minification
	uglify = require('gulp-uglify'),	//Minification
	notify = require('gulp-notify'),	//Toast notifications
	rename = require('gulp-rename'),	//File rename in a pipe
	del = require('del'),				//delete files
	vinylPaths = require('vinyl-paths'), //pipe 'del' task
	runSequence = require('run-sequence'), //syncrhonous tasks
	less = require('gulp-less');

var LessPluginCleanCSS = require("less-plugin-clean-css"),
    cleancss = new LessPluginCleanCSS({advanced: true});

var onError = notify.onError("Error: <%= error.message %>");


var JSPATH = [
	'bower_components/angular/angular.js',
	'bower_components/angular-route/angular-route.js',
	'bower_components/angular-animate/angular-animate.js',
	'bower_components/ng-notify/src/scripts/ng-notify.js',
	'src/js/**/*.js'
];

var STYLEPATH = [
	'src/css/params.less',
	'src/css/**/*.less',
	'bower_components/ng-notify/src/styles/ng-notify.css',
];

gulp.task('default', function() {
	console.log("Available tasks:");
	console.log("	dev: generates development build (clean)");
	console.log("	auto: calls dev and listens for file changes");
	console.log("	build: generates production build (concat+minified)");
	console.log("	jshint: Error checking");
});

/*PUBLIC TASKS*/
gulp.task('dev', ['jshint', 'copyLess','copyJs', 'partials', 'devIndex', 'copyAPItest'], function(){
	gulp.src("gulpfile.js").pipe(notify({"title": PROJECT_NAME, "subtitle": "Development", "message": "Dev build generated"}));
});

gulp.task('jshint', function() {
    return gulp.src('src/js/**/*.js')
    .pipe(plumber({
        errorHandler: onError
    }))
    .pipe(jshint())
    .pipe(notify({
    	title: PROJECT_NAME,
		sound:"true",
		message : function (file) {
			if (file.jshint.success) {
				return false;
			}

			var errors = file.jshint.results.map(function (data) {
			if (data.error) {
			  return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
			}
			}).join("\n");
			return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
		}
    })
    )
    .pipe(jshint.reporter('fail'));
});



gulp.task('auto', function () {
	runSequence('cleanDist',
		['dev', 'copyStatic'],
		function(){
			gulp.watch(['src/index.html', 'src/js/**/*.js', 'src/css/**/*.less','src/partials/**/*', 'src/testAPI/**/*'], ['dev']);
		});
});

gulp.task('build', function () {
	runSequence('cleanDist',
		['jshint',  'minLess', 'minJs', 'copyStatic', 'proIndex'],
		function(){
			gulp.src("gulpfile.js").pipe(notify({"title": PROJECT_NAME, "subtitle": "Development", "message": "Production build generated"}));
		});
});


/*PRIVATE TASKS*/
gulp.task('copyAPItest', function(){
	return gulp.src('src/testAPI/**/*')
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(gulp.dest('./dist/testAPI/'));
});
gulp.task('copyLess', function(){
	return gulp.src(STYLEPATH)
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(concat('build.css'))
	.pipe(less())
	.on("error", onError)
	.pipe(gulp.dest('./dist/css/'));
});

gulp.task('copyJs', function(){
	return gulp.src(JSPATH)
	.pipe(gulp.dest('./dist/js'));
});

gulp.task('minLess', function(){
	return gulp.src(STYLEPATH)
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(concat('build.css'))
	.pipe(less({
		plugins: [cleancss]
	}))
	.on("error", onError)
	.pipe(gulp.dest('./dist/css/'));
});


gulp.task('minJs', function(){
	return gulp.src(JSPATH)
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(ngAnnotate())
	.pipe(concat('build.js'))
	.pipe(uglify())
	.pipe(gulp.dest('./dist/js/'));
});

gulp.task('images', function(){
	return gulp.src('src/img/**/*')
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(gulp.dest('./dist/img/'));
});

gulp.task('fonts', function(){
	return gulp.src('src/font/**/*')
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(gulp.dest('./dist/font/'));
});


gulp.task('proIndex', function(){
	return gulp.src('src/production_index.html')
	.pipe(rename('index.html'))
	.pipe(gulp.dest('dist'));
});

gulp.task('devIndex', function(){
	return gulp.src('src/index.html')
	.pipe(rename('index.html'))
	.pipe(gulp.dest('dist'));
});

gulp.task('partials', function(){
	return gulp.src('src/partials/**/*')
	.pipe(plumber({
		handleError: onError
	}))
	.pipe(gulp.dest('./dist/partials/'));
});

gulp.task('cleanDist', function(cb){
	del('dist/**/*', cb);
});


gulp.task('copyStatic', ['partials', 'images', 'fonts']);


