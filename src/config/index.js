import convict from 'convict';

const config = convict({
  env: {
    doc: 'The applicaton environment',
    format: ['production', 'development'],
    default: 'development',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The server port',
    default: 8080,
    env: 'PORT'
  },
  log: {
    level: {
      doc: 'Log everything from this level and above. Set "none" to disable the log stream.',
      env: 'LOG_LEVEL',
      default: 'info'
    },
  },
});

config.loadFile(`${__dirname}/${config.get('env')}.json`);
config.validate();

export default config;
