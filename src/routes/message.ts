import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as fooas from '@services/fooas';

const url = '/message';

const headers = {
  type: 'object',
  properties: {
    user: {
      type: 'string',
    },
  },
};

const query = {
  type: 'object',
  required: ['company', 'from'],
  properties: {
    company: {
      type: 'string',
    },
    from: {
      type: 'string',
    },
  },
};

const response = {
  200: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      subtitle: { type: 'string' },
    },
  },
};

const schema = {
  description: `Will return content of the form 'Absolutely fucking Not, :company, No Fucking Way! - :from'`,
  tags: ['foaas'],
  headers,
  query,
  response,
  produces: [
    'application/json',
  ],
};

export async function handler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { company, from } = <{ company: string; from: string }>request.query;
    const response = await fooas.getAbsolutelyMessage(company, from);
    return response;
  } catch (error) {
    console.error(error);
    reply.code(500).send();
  }
}

export default async function register(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url,
    schema,
    handler,
    config: {
      limited: true,
      cached: true,
    },
  });
}
