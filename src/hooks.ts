import { FastifyInstance, FastifyRequest, FastifyReply, onReadyHookHandler } from 'fastify';
import { isValidRequest } from './store';

import { getSerializer } from './serializers';
import { RouteOptions } from 'fastify';

export function onRequestHook(request: FastifyRequest, reply: FastifyReply, done: Function) {
  const { headers, connection, routerPath } = request;
  const clientIp = headers['x-forwarded-for'] || connection.remoteAddress;
  const clientUser = headers.user;

  const userIdentity = clientUser || clientIp;

  if (!isValidRequest(<string>userIdentity, routerPath)) {
    reply.code(429).send('To Many Requests');
    return;
  }

  done();
}

export function preHandlerHook(request: FastifyRequest, reply: FastifyReply, done: Function) {
  const serializer = getSerializer(request, reply);

  if (serializer) {
    reply.type(<string>serializer.type).serializer((payload) => {
      return serializer.serializer(request, reply, payload);
    });
  }

  done();
}

export default function addHooks(app: FastifyInstance) {
  app.addHook('preHandler', preHandlerHook);
  app.addHook('onRoute', (options: RouteOptions) => {
    const { config = {} } = options;
    const { limited } = <{ limited: boolean }>config;

    if (limited) {
      if (!options.onRequest) {
        options.onRequest = [];
      }

      if (Array.isArray(options.onRequest)) {
        options.onRequest = [...options.onRequest, onRequestHook];
      } else {
        options.onRequest = [options.onRequest, onRequestHook];
      }
    }
  });
}
