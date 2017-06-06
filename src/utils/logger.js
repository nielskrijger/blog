import {
  Logger as WinstonLogger,
  transports as Transports,
} from 'winston';
import config from '../config';

const transports = [];

const options = Object.assign({
  level: 'none',
  colorize: true,
  prettyPrint: true,
  timestamp: true,
}, config.get('log'));

if (options.level !== 'none') {
  transports.push(new Transports.Console(options));
}

const logger = new WinstonLogger({ transports });

// Streap API is required for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.replace(/\s+$/g, '')); // Remove newlines at the end
  }
};

export default logger;
