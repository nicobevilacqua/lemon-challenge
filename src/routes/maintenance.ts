import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default async function routes(fastify: FastifyInstance, options: any) {
  fastify.get('/ping', {}, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send('pong');
    } catch (error) {
      console.error(error);
      reply.send(500);
    }
  });
}
