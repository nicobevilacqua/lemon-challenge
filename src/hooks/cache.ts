import { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from 'fastify';
import store from '@store/index';

const CACHE_DEFAULT_TTL = process.env.CACHE_DEFAULT_TTL ? parseInt(process.env.CACHE_DEFAULT_TTL, 10) : 1000 * 10;

function getCacheKey(request: FastifyRequest): string {
  const key = `${request.url}${JSON.stringify(request.query)}`;
  return key;
}

export function cacheResponseFactory() {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    const key = getCacheKey(request);
    const cache = await store.get(key);
    if (cache) {
      reply.code(200).send(cache);
      return;
    }
  }
}

export function cacheRegistrationFactory({
  ttl = CACHE_DEFAULT_TTL
} = {}) {
  return async function (request: FastifyRequest, reply: FastifyReply, payload: any) {
    if (reply.raw.statusCode === 200) {
      const key = getCacheKey(request);
      await store.set(key, payload, ttl);
    }
  }
}

type RequestConfig = {
  cached?: boolean,
  ttl?: number,
};

export default function register(app: FastifyInstance) {
  app.addHook('onRoute', (options: RouteOptions) => {
    const { config = {} } = options;
    const { cached, ttl = CACHE_DEFAULT_TTL } = <RequestConfig>config;

    if (!options.onRequest) {
      options.onRequest = [];
    }

    if (!Array.isArray(options.onRequest)) {
      options.onRequest = [options.onRequest];
    }

    if (!options.onSend) {
      options.onSend = []; 
    }

    if (!Array.isArray(options.onSend)) {
      options.onSend = [options.onSend];
    }

    if (cached) {
      options.onRequest.push(cacheResponseFactory());
      options.onSend.push(cacheRegistrationFactory({ ttl }));
    }
  });
}