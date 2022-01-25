import MockDate from 'mockdate';
import { buildApp } from './helpers';
import {
  htmlSerializer,
  xmlSerializer,
  plainTextSerializer,
  javascriptSerializer,
} from './serializers';

const app = buildApp();

const TTL = process.env.TTL ? parseInt(process.env.TTL, 10) : 1000 * 10;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 5;

const user1 = 'user1:ebGcXZrHscCaLvBgOaSvsDaCvNIdiJtI';
const user2 = 'user2:ebGdssacXaZrHaLvBgsdJAnsw3sA';

const query = {
  company: 'company',
  from: 'from',
};

const payload = {
  message: `Absolutely fucking Not, ${query.company}, No Fucking Way!`,
  subtitle: `- ${query.from}`,
};

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // run tests on different time spans to avoid conflicts
    MockDate.set(new Date().getTime() + TTL);
  });

  afterAll(() => {
    MockDate.reset();
  });

  describe('/message', () => {
    it('should return 200', async () => {
      const response = await app.inject({
        url: '/message',
        query,
        headers: {
          user: user1,
        },
      });
      expect(response.statusCode).toEqual(200);
    });

    it(`should fail on the 6th request`, async () => {
      const calls = [];
      for (let i = 0; i < LIMIT; i++) {
        calls.push(
          app.inject({
            url: '/message',
            query,
            headers: {
              user: user1,
            },
          })
        );
      }
      const responses = await Promise.all(calls);
      expect(responses.every(({ statusCode }) => statusCode === 200)).toBe(true);

      const failResposne = await app.inject({
        url: '/message',
        query,
        headers: {
          user: user1,
        },
      });

      expect(failResposne.statusCode).toEqual(429);
    });

    it(`limit should be reseted after ${TTL} miliseconds`, async () => {
      const calls = [];
      for (let i = 0; i < LIMIT; i++) {
        calls.push(
          app.inject({
            url: '/message',
            query,
            headers: {
              user: user1,
            },
          })
        );
      }
      const responses = await Promise.all(calls);
      expect(responses.every(({ body, statusCode }) => statusCode === 200)).toBe(true);

      MockDate.set(new Date().getTime() + TTL);

      const response = await app.inject({
        url: '/message',
        query,
        headers: {
          user: user1,
        },
      });

      expect(response.statusCode).toEqual(200);
    });

    it(`two users should be able to call same endpoint ${LIMIT} times in ${TTL} milliseconds`, async () => {
      const calls = [];
      for (let i = 0; i < LIMIT; i++) {
        calls.push(
          app.inject({
            url: '/message',
            query,
            headers: {
              user: user1,
            },
          })
        );
        calls.push(
          app.inject({
            url: '/message',
            query,
            headers: {
              user: user2,
            },
          })
        );
      }
      const responses = await Promise.all(calls);
      expect(responses.every(({ body, statusCode }) => statusCode === 200)).toBe(true);
    });

    describe('response types', () => {
      [
        {
          type: 'text/html',
          query: {
            ...query,
          },
          payload: {
            ...payload,
          },
          serializer: htmlSerializer,
        },
        {
          type: 'application/javascript',
          query: {
            ...query,
            callback: 'foo',
          },
          payload: {
            ...payload,
          },
          serializer: javascriptSerializer,
        },
        {
          type: 'application/xml',
          query: {
            ...query,
          },
          payload: {
            ...payload,
          },
          serializer: xmlSerializer,
        },
        {
          type: 'text/plain',
          query: {
            ...query,
          },
          payload: {
            ...payload,
          },
          serializer: plainTextSerializer,
        },
      ].forEach(({ type, serializer, query, payload }) => {
        it(type, async () => {
          const response = await app.inject({
            url: '/message',
            query,
            headers: {
              accept: type,
              user: user1,
            },
          });
          expect(response.statusCode).toEqual(200);
          expect(response.headers['content-type']).toEqual(type);
          expect(response.body).toEqual(serializer({ query } as any, {} as any, payload as any));
        });
      });
    });
  });
});
