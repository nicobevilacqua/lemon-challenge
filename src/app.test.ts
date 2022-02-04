import MockDate from 'mockdate';
import build from './app';

jest.mock('axios');
import axios from 'axios';
import LightMyRequest from 'light-my-request';

const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = build();

const TTL = process.env.TTL ? parseInt(process.env.TTL, 10) : 1000 * 10;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 5;

const user1 = 'user1:ebGcXZrHscCaLvBgOaSvsDaCvNIdiJtI';
const user2 = 'user2:ebGdssacXaZrHaLvBgsdJAnsw3sA';

const query = {
  company: 'company',
  from: 'from',
};

const payload = {
  message: `Aaabsolutely fucking Not, ${query.company}, No Fucking Way!`,
  subtitle: `- ${query.from}`,
};

mockedAxios.get.mockImplementation(() => Promise.resolve({
  data: payload,
}));

describe('app', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // run tests on different time spans to avoid conflicts
    MockDate.set(new Date().getTime() + TTL * 2);
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
      expect(response.body).toEqual(JSON.stringify(payload));
    });

    it(`should fail on the request number ${LIMIT + 1}`, async () => {
      const responses: LightMyRequest.Response[] = [];
      let response;
      for (let i = 0; i < LIMIT; i++) {
        response = await app.inject({
          url: '/message',
          query,
          headers: {
            user: user1,
          },
        });
        responses.push(response);
      }
      
      expect(responses.every(({ body, statusCode }) => statusCode === 200 && body === JSON.stringify(payload))).toBe(true);

      const failedResponse = await app.inject({
        url: '/message',
        query,
        headers: {
          user: user1,
        },
      });

      expect(failedResponse.statusCode).toEqual(429);
    });

    it(`limit should be reseted after ${TTL} miliseconds`, async () => {
      const responses: LightMyRequest.Response[] = [];
      let response;
      
      for (let i = 0; i < LIMIT; i++) {
        response = await app.inject({
          url: '/message',
          query,
          headers: {
            user: user1,
          },
        });
      }

      expect(responses.every(({ body, statusCode }) => statusCode === 200 && body === JSON.stringify(payload))).toBe(true);

      MockDate.set(new Date().getTime() + TTL);

      response = await app.inject({
        url: '/message',
        query,
        headers: {
          user: user1,
        },
      });

      expect(response.statusCode).toEqual(200);
    });

    it(`two users should be able to call same endpoint ${LIMIT} times in ${TTL} milliseconds`, async () => {
      const responses: LightMyRequest.Response[] = [];

      let responseUser1: LightMyRequest.Response;
      let responseUser2: LightMyRequest.Response

      for (let i = 0; i < LIMIT; i++) {
        responseUser1 = await app.inject({
          url: '/message',
          query,
          headers: {
            user: user1,
          },
        });
        
        responses.push(responseUser1);

        responseUser2 = await app.inject({
          url: '/message',
          query,
          headers: {
            user: user2,
          },
        });

        responses.push(responseUser2);
      }

      expect(responses.every(({ body, statusCode }) => statusCode === 200 && body === JSON.stringify(payload))).toBe(true);
    });
  });
});
