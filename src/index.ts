import { config } from 'dotenv';
config();

import pino from 'pino';

const HOST: string = process.env.HOST || '127.0.0.1';
const PORT: string | number = process.env.PORT || 7000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

import createApp from './app';

const server = createApp({
  logger: pino({ 
    level: LOG_LEVEL,
    prettyPrint: true,
  }),
});

async function start() {
  try {
    await server.listen(PORT, HOST);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
