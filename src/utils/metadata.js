import path from 'path';
import moment from 'moment';

/**
 * Fetches title from markdown page. Assumes page begins with '# My Title'.
 */
function parseTitle(fileName, contents) {
  const lines = contents.split("\n");
  return lines[0].replace(/#+(.*)/, "$1").trim();
}


/**
 * Parses the post slug and date from the filename.
 */
export function parseBlogData(filepath, contents) {
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
