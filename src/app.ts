import fastify from 'fastify';

import maintenanceRoutes from './routes/maintenance';
import foaasRoutes from './routes/foaas';

export default function build(opts = {}) {
  const app = fastify(opts);

  app.register(maintenanceRoutes);
  app.register(foaasRoutes);

  return app;
}
