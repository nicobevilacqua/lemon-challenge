import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

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
    callback: {
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
    'application/xml',
    'application/javascript',
    'application/json',
    'text/plain',
    'text/html',
  ],
};

export async function handler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { company, from } = <{ company: string; from: string }>request.query;
    return {
      message: `Absolutely fucking Not, ${company}, No Fucking Way!`,
      subtitle: `- ${from}`,
    };
  } catch (error) {
    console.error(error);
    reply.code(500);
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
      html: true,
      text: true,
      json: true,
      xml: true,
      jsonp: true,
    },
  });
}
