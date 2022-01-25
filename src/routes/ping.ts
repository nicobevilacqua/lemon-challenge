import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const url = '/ping';

const schema = {
  description: 'ping response',
  tags: ['maintenance'],
  summary: 'png response',
  response: {
    200: {
      description: 'Successful response',
      type: 'string',
    },
  },
};

export async function handler(request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send('pong');
  } catch (error) {
    console.error(error);
    reply.send(500);
  }
}

export default async function register(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url,
    schema,
    handler,
    config: {
      limited: false,
      text: true,
    },
  });
}
