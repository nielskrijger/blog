import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { parseBlogData } from '../utils/metadata';

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
