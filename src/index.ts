import pino from 'pino';
const port = process.env.PORT || 7000;

import createApp from './app';

const server = createApp({
  logger: pino({ level: 'info', prettyPrint: true }),
});

async function start() {
  try {
    await server.listen(port);
    console.log('Server started successfully on port', port);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
