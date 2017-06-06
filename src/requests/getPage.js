import marked from 'marked';
import fs from 'fs';
import path from 'path';

/**
 * GET /pages/:slug
 */
export default (req, res, next) => {
  const filepath = path.join(__dirname, '..', 'pages', `${req.params.slug}.md`);
  fs.readFile(filepath, 'utf8', (err, fileContent) => {
    if (err) {
      res.status(404);
    } else {
      res.render('page', {
        content: marked(fileContent),
      });
    }
  });
}
