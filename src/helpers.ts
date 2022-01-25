import build from './app';

export function buildApp() {
  const app = build();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(() => app.close());

  return app;
}
