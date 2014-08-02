'use strict';

var gulp = require('gulp');
var awspublish = require('gulp-awspublish');
var runSequence = require('run-sequence');
var clean = require('gulp-clean');
var markdown = require('gulp-markdown');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var handlebars = require('gulp-handlebars');
var defineModule = require('gulp-define-module');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var blogData = require('./lib/gulp-blog-data');

var paths = {
    html: './static/*',
    markdown: ['./pages/*.md', './posts/*.md'],
    posts: './posts/*.md',
    js: './static/js/*',
    css: './static/css/*',
    images: './static/images/*',
    templates: './static/templates/*.hbs',
    publish: './dist/**/*'
};
var awsconfig = {
    region: 'eu-west-1',
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: 'nielskrijger.com'
};
var buildTasks = ['build-markdown', 'build-scripts', 'build-styles', 'build-images', 'build-html', 'build-templates', 'build-blog-data'];

gulp.task('build-clean', function() {
    return gulp.src('dist')
        .pipe(clean({
            force: true
        }));
});

gulp.task('build-markdown', function() {
    return gulp.src(paths.markdown, {base: './'})
        .pipe(markdown())
        .pipe(gulp.dest('dist'));
});

gulp.task('build-blog-data', function() {
    return gulp.src(paths.posts)
        .pipe(blogData('data.json'))
        .pipe(gulp.dest('dist'))
});

gulp.task('build-scripts', function() {
    return gulp.src(paths.js)
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
});

gulp.task('build-styles', function() {
    return gulp.src(paths.css)
        .pipe(minifyCSS({
            keepBreaks: true
        }))
        .pipe(gulp.dest('dist/css'))
});

gulp.task('build-images', function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest('dist/images'))
});

gulp.task('build-html', function(callback) {
    return gulp.src(paths.html)
        .pipe(gulp.dest('dist'));
});

gulp.task('build-templates', function() {
    return gulp.src(paths.templates)
        .pipe(handlebars())
        .pipe(defineModule('plain'))
        .pipe(declare({
            namespace: 'MarkdownBlog.templates'
        }))
        .pipe(concat('templates.js'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('publish', function() {
    var publisher = awspublish.create(awsconfig);
    return gulp.src(paths.publish)
        .pipe(publisher.publish())
        .pipe(publisher.cache())
        .pipe(publisher.sync())
        .pipe(awspublish.reporter());
});

gulp.task('build', function(callback) {
    return runSequence('build-clean', buildTasks,
        callback);
});

gulp.task('watch', function() {
    gulp.watch(paths.html, ['build-html', 'publish']);
    gulp.watch(paths.markdown, ['build-markdown', 'build-blog-data', 'publish']);
    gulp.watch(paths.js, ['build-scripts', 'publish']);
    gulp.watch(paths.css, ['build-styles', 'publish']);
    gulp.watch(paths.images, ['build-images', 'publish']);
    gulp.watch(paths.templates, ['build-templates', 'publish']);
});

gulp.task('default', function(callback) {
    return runSequence('build-clean', buildTasks, 'publish',
        callback);
});
