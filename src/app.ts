import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { propertiesRoutes } from './modules/properties/properties.routes';
import { reservationsRoutes } from './modules/reservations/reservations.routes';
import { guestsRoutes } from './modules/guests/guests.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { inquiriesRoutes } from './modules/inquiries/inquiries.routes';
import { packagesRoutes } from './modules/packages/packages.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { uploadRoutes } from './modules/upload/upload.routes';

export async function buildApp() {
  const app = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Zod Type Provider Compiler
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Security Plugins
  await app.register(cors, {
    origin: '*', // To be restricted in production
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Guamal Mini Barrio API',
        description: 'Backend API for Guamal Mini Barrio reservations and administration',
        version: '1.0.0',
      },
      servers: [],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Register Routes
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.register(async (api) => {
    // API Routes
    await api.register(propertiesRoutes, { prefix: '/properties' });
    await api.register(reservationsRoutes, { prefix: '/reservations' });
    await api.register(guestsRoutes, { prefix: '/guests' });
    await api.register(adminRoutes, { prefix: '/admin' });
    await api.register(settingsRoutes, { prefix: '/settings' });
    await api.register(inquiriesRoutes, { prefix: '/inquiries' });
    await api.register(packagesRoutes, { prefix: '/packages' });
    await api.register(authRoutes, { prefix: '/auth' });
    await api.register(usersRoutes, { prefix: '/users' });
    await api.register(paymentsRoutes, { prefix: '/payments' });
    await api.register(uploadRoutes, { prefix: '/upload' });
  }, { prefix: '/api' });

  return app;
}
