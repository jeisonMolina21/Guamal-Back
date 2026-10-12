import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Package } from '../../database/models/Package';

export const packagesRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get active packages (for frontend)
  app.get('/', {
    schema: {
      tags: ['Packages'],
      summary: 'Get all active promotional packages',
      querystring: z.object({
        all: z.enum(['true', 'false']).optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { all } = request.query;
      const where = all === 'true' ? {} : { isActive: true };
      const packages = await Package.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });
      return packages;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch packages' });
    }
  });

  // Get single package by slug or id
  app.get('/:identifier', {
    schema: {
      tags: ['Packages'],
      summary: 'Get package by slug or ID',
      params: z.object({
        identifier: z.string(),
      })
    }
  }, async (request, reply) => {
    try {
      const { identifier } = request.params;
      let pkg = await Package.findOne({ where: { slug: identifier } });
      if (!pkg) {
        pkg = await Package.findByPk(identifier);
      }
      if (!pkg) {
        return reply.code(404).send({ error: 'Package not found' });
      }
      return pkg;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch package' });
    }
  });

  // Create package (admin)
  app.post('/', {
    schema: {
      tags: ['Packages'],
      summary: 'Create a new promotional package',
      body: z.object({
        title: z.string().min(3),
        slug: z.string().min(3),
        description: z.string(),
        discountPercentage: z.number().default(0),
        fixedPrice: z.number().optional(),
        minNights: z.number().default(1),
        minGuests: z.number().default(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isActive: z.boolean().default(true),
        bannerImage: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const pkg = await Package.create(request.body);
      return reply.code(201).send(pkg);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to create package' });
    }
  });

  // Update package
  app.put('/:id', {
    schema: {
      tags: ['Packages'],
      summary: 'Update a promotional package',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        discountPercentage: z.number().optional(),
        fixedPrice: z.number().optional(),
        minNights: z.number().optional(),
        minGuests: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const pkg = await Package.findByPk(id);
      if (!pkg) {
        return reply.code(404).send({ error: 'Package not found' });
      }
      await pkg.update(request.body);
      return { success: true, package: pkg };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update package' });
    }
  });
};
