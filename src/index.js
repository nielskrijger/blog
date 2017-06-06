require('babel-register');
const log = require('./utils/logger').default;
const server = require('./server').default;
const config = require('./config').default;

server.listen(config.get('port'), () => {
  log.info('Server listening at http://%s:%s',
    server.address().address,
    server.address().port);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
