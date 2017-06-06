import fs from 'fs';
import path from 'path';
import moment from 'moment';

/**
 * Fetches title from markdown page. Assumes page begins with '# My Title'.
 */
function parseTitle(fileName, contents) {
  const lines = contents.split("\n");
  if (lines.length === 0) {
    return this.emit('error', new PluginError(PLUGIN_NAME, 'Empty file "' + fileName + '"'));
  }
  return lines[0].replace(/#+(.*)/, "$1").trim();
}

/**
 * Parses the post slug and date from the filename.
 */
function parseBlogData(filepath, contents) {
  const fileName = path.basename(filepath);
  const basename = path.basename(filepath, '.md');
  const date = moment(basename.substring(0, 10));
  if (!date.isValid()) {
    return; // Ignore
  }

  // Add post to list
  return {
    date: date.format('YYYY-MM-DD'),
    slug: basename.substring(11),
    title: parseTitle(fileName, contents.toString()),
    href: `posts/${date.format('YYYY-MM-DD')}/${basename.substring(11)}`,
  };
}

/**
 * Sorts posts in ascending order.
 */
function sortPosts(posts) {
  posts.sort((a, b) => {
    if (moment(a.date).isBefore(moment(b.date))) {
      return 1;
    } else if (moment(a.date).isAfter(moment(b.date))) {
      return -1;
    }
    return 0;
  });
  return posts;
}

/**
 * Generates array with all blogpost metadata for all blogs.
 */
function generateResponse(dir, filenames) {
  const promises = filenames.map((filename) => {
    return new Promise((resolve, reject) => {
      const filepath = `${dir}/${filename}`;
      fs.readFile(filepath, 'utf8', (err, contents) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseBlogData(filepath, contents));
        }
      });
    });
  });

  return Promise.all(promises).then(sortPosts);
}

/**
 * GET /posts
 */
export default (req, res, next) => {
  const dir = path.join(__dirname, '..', 'posts');
  fs.readdir(dir, (err, filenames) => {
    if (err) {
      return next(err);
    }

    generateResponse(dir, filenames)
      .then((posts) => {
        res.render('home', {
          posts,
        });
      })
      .catch(next);
  });
}
