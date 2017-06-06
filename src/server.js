import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import http from 'http';
import path from 'path';
import exphbs from 'express-handlebars';
import log from './utils/logger';
import config from './config';
import router from './router';

log.info('Starting server...', {
  env: config.get('env'),
  port: config.get('port'),
  pid: process.pid,
  node: process.version,
});

const app = express();
const hbs = exphbs.create({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, '/views/layouts'),
  defaultLayout: 'main',
});

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views'));
app.engine('hbs', hbs.engine);

app.use(cors());
app.use(morgan('short', { stream: log.stream }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);
app.use((err, req, res, next) => {
  log.error(err);
});

// Create an HTTP server for our Express app
const server = http.createServer(app);
server.on('close', () => {
  log.info('Closing HTTP server');
});
export default server;
