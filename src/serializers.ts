import pug from 'pug';
import { toXML } from 'jstoxml';
import { FastifyRequest, FastifyReply } from 'fastify';

type ReplyPayload = {
  message: string;
  subtitle: string;
};

type Serializer = {
  type: string;
  valid?(request: FastifyRequest, reply: FastifyReply): Boolean;
  serializer(request: FastifyRequest, reply: FastifyReply, payload: ReplyPayload): string;
};

type FastifyRequestWithTypes = FastifyRequest & { types: Function };

export function htmlSerializer(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: ReplyPayload
): string {
  const html = pug.renderFile('./src/templates/index.pug', payload);
  return html;
}

export function javascriptSerializer(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: ReplyPayload
): string {
  const { callback } = <{ callback: string }>request.query;
  return `${callback}(${JSON.stringify(payload)})`;
}

export function plainTextSerializer(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: ReplyPayload
): string {
  return `${payload.message} ${payload.subtitle}`;
}

export function xmlSerializer(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: ReplyPayload
): string {
  return toXML(
    {
      _name: 'response',
      _content: payload,
    },
    {
      header: true,
    }
  );
}

export function jsonSerializer(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: ReplyPayload
): string {
  return JSON.stringify(payload);
}

export const serializers: Serializer[] = [
  {
    type: 'text/html',
    valid(request) {
      const {
        context: { config },
      } = request;
      const { html } = <{ html: boolean }>config;
      return !!html;
    },
    serializer: htmlSerializer,
  },
  {
    type: 'text/plain',
    valid(request) {
      const {
        context: { config },
      } = request;
      const { text } = <{ text: boolean }>config;
      return !!text;
    },
    serializer: plainTextSerializer,
  },
  {
    type: 'application/javascript',
    valid(request) {
      const {
        query,
        context: { config },
      } = request;
      const { callback } = <{ callback: string | undefined }>query;
      const { jsonp } = <{ jsonp: boolean }>config;
      return !!callback && !!jsonp;
    },
    serializer: javascriptSerializer,
  },
  {
    type: 'application/xml',
    valid(request) {
      const {
        context: { config },
      } = request;
      const { xml } = <{ xml: boolean }>config;
      return !!xml;
    },
    serializer: xmlSerializer,
  },
  {
    type: 'application/json',
    valid(request) {
      const {
        context: { config },
      } = request;
      const { json } = <{ json: boolean }>config;
      return !!json;
    },
    serializer: jsonSerializer,
  },
];

export function getSerializer(request: FastifyRequest, reply: FastifyReply) {
  const types = (request as FastifyRequestWithTypes).types();

  return serializers.find(
    ({ type, valid }) => types.includes(type) && (!valid || valid(request, reply))
  );
}
