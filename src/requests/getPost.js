import marked from 'marked';
import fs from 'fs';
import path from 'path';

/**
 * GET /posts/:date/:slug
 */
export default (req, res, next) => {
  const filepath = path.join(__dirname, '..', 'posts', `${req.params.date}-${req.params.slug}.md`);
  fs.readFile(filepath, 'utf8', (err, fileContent) => {
    if (err) {
      res.status(404).send();
    } else {
      res.render('post', { content: marked(fileContent) });
    }
  });
}
