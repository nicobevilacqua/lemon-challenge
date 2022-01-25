import { buildApp } from './helpers';

const app = buildApp();

it('default root route', async () => {
  const response = await app.inject({
    url: '/ping',
  });
  expect(response.body).toEqual('pong');
});
