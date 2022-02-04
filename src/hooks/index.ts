import { FastifyInstance } from 'fastify';

import cacheHooks from './cache';
import limitHooks from './limit';

export default function addHooks(app: FastifyInstance) {
  limitHooks(app);
  cacheHooks(app);
}
