var gulp = require('gulp');
var prefix = require('gulp-autoprefixer');
var stylus = require('gulp-stylus');
// var browserify = require('browserify');
// var source = require('vinyl-source-stream');

gulp.task('stylus', function() {
  gulp.src('styl/**/*.styl')
    .pipe(stylus({
      'include css': true
    }))
    // .pipe(prefix(["last 2 version"]))
    .pipe(gulp.dest(''))
});

// gulp.task('browserify', function() {
//   return browserify('simple-grid-filter.js')
//     .bundle()
//     //Pass desired output filename to vinyl-source-stream
//     .pipe(source('bundle.js'))
//     // Start piping stream to tasks!
//     .pipe(gulp.dest(''));
// });

gulp.task('watch', function() {
  gulp.watch('styl/**/*.styl', ['stylus']);
  // gulp.watch('**/*.js', ['browserify']);
})

gulp.task('default', ['stylus', 'watch']);