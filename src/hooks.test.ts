import { FastifyRequest, FastifyReply } from 'fastify';
import MockDate from 'mockdate';
import { onRequestHook } from './hooks';

const ip1 = '21.201.221.01';
const user1 = 'user1:ebGcXZrHscCaLvBgOaSvsDaCvNIdiJtI';
const user2 = 'user2:ebGdssacXaZrHaLvBgsdJAnsw3sA';
const path1 = '/path1';
const path2 = '/path2';

const TTL = process.env.TTL ? parseInt(process.env.TTL, 10) : 1000 * 10;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 5;

type MockedFastifyRequest = Partial<Omit<FastifyRequest, 'connection'>> & {
  connection: { remoteAddress?: string };
};
type MockedFastifyReply = Partial<FastifyReply>;

function getMockedFastifyRequest(
  user: string | undefined,
  remoteAddress: string,
  routerPath: string
): MockedFastifyRequest {
  const mockedFastifyRequest: MockedFastifyRequest = {
    routerPath,
    headers: {
      user,
    },
    connection: {
      remoteAddress,
    },
  };
  return mockedFastifyRequest;
}

const TO_MANY_REQUESTS_CODE = 429;
const TO_MANY_REQUESTS_MESSAGE = 'To Many Requests';

const mockedFastifyReply: MockedFastifyReply = {
  send: jest.fn().mockReturnThis(),
  code: jest.fn().mockReturnThis(),
};

async function callXTimes({
  user,
  ip,
  path,
  times = 1,
}: {
  user?: string;
  ip: string;
  path: string;
  times?: number;
}) {
  const mockedFastifyRequest = getMockedFastifyRequest(user, ip, path);
  for (let i = 0; i < times; i++) {
    onRequestHook(
      <FastifyRequest>mockedFastifyRequest,
      <FastifyReply>mockedFastifyReply,
      jest.fn()
    );
  }
}

describe('hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // run tests on different time spans to avoid conflicts
    MockDate.set(new Date().getTime() + TTL);
  });

  afterAll(() => {
    MockDate.reset();
  });

  describe('onRequestHook', () => {
    it(`should pass if the user requests are less than ${LIMIT}`, async () => {
      await callXTimes({
        user: user1,
        path: path1,
        times: 1,
        ip: ip1,
      });
      expect(mockedFastifyReply.send).not.toHaveBeenCalled();
    });

    it(`should use the ip as the identifier if the header is not set`, async () => {
      await callXTimes({
        path: path1,
        times: 1,
        ip: ip1,
      });

      expect(mockedFastifyReply.send).not.toHaveBeenCalled();

      await callXTimes({
        path: path1,
        times: 4,
        ip: ip1,
      });

      expect(mockedFastifyReply.send).not.toHaveBeenCalled();

      await callXTimes({
        path: path1,
        times: 1,
        ip: ip1,
      });

      expect(mockedFastifyReply.code).toHaveBeenCalledWith(TO_MANY_REQUESTS_CODE);
      expect(mockedFastifyReply.send).toHaveBeenCalledWith(TO_MANY_REQUESTS_MESSAGE);
    });

    it(`should fail if the user make more than ${LIMIT} calls in ${TTL} milliseconds`, async () => {
      await callXTimes({
        user: user1,
        path: path1,
        times: 6,
        ip: ip1,
      });
      expect(mockedFastifyReply.code).toHaveBeenCalledWith(TO_MANY_REQUESTS_CODE);
      expect(mockedFastifyReply.send).toHaveBeenCalledWith(TO_MANY_REQUESTS_MESSAGE);
    });

    it(`should not fail if two users call the same path less than ${LIMIT} times in ${TTL} milliseconds`, async () => {
      await Promise.all([
        callXTimes({
          user: user1,
          path: path1,
          times: LIMIT,
          ip: ip1,
        }),
        callXTimes({
          user: user2,
          path: path1,
          times: LIMIT,
          ip: ip1,
        }),
      ]);
      expect(mockedFastifyReply.send).not.toHaveBeenCalled();
    });

    it(`an user should be able to call two different paths ${LIMIT} times in ${TTL} milliseconds each`, async () => {
      await Promise.all([
        callXTimes({
          user: user1,
          path: path1,
          times: LIMIT,
          ip: ip1,
        }),
        callXTimes({
          user: user1,
          path: path2,
          times: LIMIT,
          ip: ip1,
        }),
      ]);
      expect(mockedFastifyReply.send).not.toHaveBeenCalled();
    });

    it(`an user should be able to call an endpoint 10 times, wait 10 seconds and call the endpoint again`, async () => {
      await callXTimes({
        user: user1,
        path: path1,
        times: LIMIT,
        ip: ip1,
      });

      MockDate.set(new Date().getTime() + TTL);

      await callXTimes({
        user: user1,
        path: path2,
        times: LIMIT,
        ip: ip1,
      });
      expect(mockedFastifyReply.send).not.toHaveBeenCalled();
    });

    it(`an user should be able to call an endpoint ${LIMIT} times, wait until the first call expires, and call it again`, async () => {
      await await callXTimes({
        user: user1,
        path: path2,
        times: 1,
        ip: ip1,
      });

      MockDate.set(new Date().getTime() + 1000 * 1);

      await await callXTimes({
        user: user1,
        path: path2,
        times: LIMIT - 1,
        ip: ip1,
      });

      MockDate.set(new Date().getTime() + TTL - 1000);

      await await callXTimes({
        user: user1,
        path: path2,
        times: 1,
        ip: ip1,
      });

      expect(mockedFastifyReply.send).not.toHaveBeenCalled();
    });
  });
});
