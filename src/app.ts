import fastify from 'fastify';
import helmet from 'fastify-helmet';
import cors from 'fastify-cors';
import fastifyAccepts from 'fastify-accepts';
import swagger, { FastifyDynamicSwaggerOptions } from 'fastify-swagger';

import addHooks from './hooks/index';

// Routes
import ping from './routes/ping';
import message from './routes/message';

const swaggerOptions: FastifyDynamicSwaggerOptions = {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'API with Fastify',
      description: 'Testing the Fastify swagger API',
      version: '0.1.0',
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here',
    },
    host: '127.0.0.1:7000',
    schemes: ['http'],
    definitions: {},
  },
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next();
    },
    preHandler: function (request, reply, next) {
      next();
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  exposeRoute: true,
};

export default function build(opts = {}) {
  const app = fastify(opts);

  if (process.env.ENV === 'production') {
    app.register(helmet, { global: true });
    app.register(cors);
  }

  app.register(fastifyAccepts);
  app.register(swagger, swaggerOptions);

  addHooks(app);

  app.register(message);
  app.register(ping);

  app.ready((error) => {
    if (error) {
      throw error;
    }
    app.swagger();
  });

  return app;
}
