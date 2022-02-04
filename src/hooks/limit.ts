import { FastifyInstance, RouteOptions, FastifyRequest, FastifyReply } from 'fastify';
import store from '@store/index';

const TTL = process.env.TTL ? parseInt(process.env.TTL, 10) : 1000 * 10;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 5;

export async function onRequestHook(request: FastifyRequest, reply: FastifyReply) {
  const { headers, connection, routerPath } = request;
  const clientIp = headers['x-forwarded-for'] || connection.remoteAddress;
  const clientUser = headers.user;

  const userIdentity = clientUser || clientIp;
  const key = `${userIdentity}-${routerPath}`;
  const now = new Date().getTime();

  let entries: number[] = [];

  const cache = await store.get(key);
  if (cache) {
    entries = cache;
  }

  entries = entries.filter((timestamp: number) => timestamp > now - TTL);
  entries.push(now);

  const isRequestValid = entries.length <= LIMIT;

  if (!isRequestValid) {
    reply.code(429).send('To Many Requests');
    return;
  }

  await store.set(key, entries);
}

type RequestConfig = {
  limited?: boolean,
};

export default function register(app: FastifyInstance) {
  app.addHook('onRoute', (options: RouteOptions) => {
    const { config = {} } = options;
    const { limited } = <RequestConfig>config;

    if (!options.onRequest) {
      options.onRequest = [];
    }

    if (!Array.isArray(options.onRequest)) {
      options.onRequest = [options.onRequest];
    }

    if (limited) {
      options.onRequest.push(onRequestHook);
    }
  });
}