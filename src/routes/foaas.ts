import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default async function routes(fastify: FastifyInstance, options: any) {
  fastify.get('/message', {}, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('asd');
      return reply.send('asdasdsa');
    } catch (error) {
      console.error(error);
      reply.send(500);
    }
  });
}
