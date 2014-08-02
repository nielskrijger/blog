'use strict';

var through = require('through');
var path = require('path');
var gutil = require('gulp-util');
var moment = require('moment');
var PluginError = gutil.PluginError;
var File = gutil.File;
var Buffer = require('buffer').Buffer;
var fs = require('fs');
var util = require('util');

var PLUGIN_NAME = 'gulp-blog-data';

function parseTitle(fileName, contents) {
    var lines = contents.split("\n");

    if (lines.length === 0) {
        return this.emit('error', new PluginError(PLUGIN_NAME, 'Empty file "' + fileName + '"'));
    }

    return lines[0].replace(/#+(.*)/, "$1").trim();
}

function parseBlogData(file) {
    // Parse the post slug and date from the filename
    var fileName = path.basename(file.path);
    var basename = path.basename(file.path, '.md');
    var date = moment(basename.substring(0, 10));
    if (!date.isValid()) {
        return; // Ignore
    }

    // Add post to list
    return {
        'date': date.format('YYYY-MM-DD'),
        'slug': basename.substring(11),
        'title': parseTitle(fileName, file.contents.toString()),
        'href': 'posts/' + basename + '.html'
    };
}

function gulpBlogData(fileName, opt) {
    if (!fileName) {
        throw new PluginError(PLUGIN_NAME, 'Missing fileName option for ' + PLUGIN_NAME);
    }
    if (!opt) {
        opt = {};
    }

    var firstFile = null;
    var data = {
        posts: []
    };

    function bufferContents(file) {
        if (file.isStream()) {
            return this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        // The first file is used to identify the current working directory and file stats
        if (!firstFile) {
            firstFile = file;
        }

        // Add post to list but ignore if the result is null or undefined
        var result = parseBlogData(file);
        if (result) {
            data.posts.push(result);
        }
    }

    function endStream() {
        if (firstFile) {
            // Sort posts with newest first
            data.posts.sort(function(a, b) {
                if (moment(a.date).isBefore(moment(b.date))) {
                    return 1;
                } else if (moment(a.date).isAfter(moment(b.date))) {
                    return -1;
                }
                return 0;
            });

            // Create a new file that stores the contents
            var joinedFile = new File({
                cwd: firstFile.cwd,
                base: firstFile.base,
                path: path.join(firstFile.base, fileName),
                contents: new Buffer(JSON.stringify(data)),
                stat: firstFile.stat
            });
            this.emit('data', joinedFile);
        }

        this.emit('end');
    }

    return through(bufferContents, endStream);
};

// Exporting the plugin main function
module.exports = gulpBlogData;
