import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Property } from '../../database/models/Property';
import { Reservation } from '../../database/models/Reservation';
import { Op } from 'sequelize';

export const propertiesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', {
    schema: {
      tags: ['Properties'],
      summary: 'Get all active properties with real-time date availability check',
      querystring: z.object({
        guests: z.coerce.number().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        all: z.enum(['true', 'false']).optional()
      })
    }
  }, async (request, reply) => {
    try {
      const { guests, checkIn, checkOut, all } = request.query;

      // If 'all' is requested (e.g. from Admin Panel), return all properties without status/date filters
      if (all === 'true') {
        const allProperties = await Property.findAll({
          order: [['capacity', 'ASC']]
        });
        return allProperties;
      }

      let occupiedPropertyIds: string[] = [];

      // 1. If dates are provided, find all properties with active, non-expired reservations
      if (checkIn && checkOut) {
        const now = new Date();

        const activeReservations = await Reservation.findAll({
          where: {
            [Op.and]: [
              { checkIn: { [Op.lt]: checkOut } },
              { checkOut: { [Op.gt]: checkIn } },
              {
                [Op.or]: [
                  { status: { [Op.in]: ['CONFIRMADA', 'CHECK_IN'] } },
                  {
                    status: 'PENDIENTE',
                    [Op.or]: [
                      { expiresAt: { [Op.gt]: now } },
                      { expiresAt: null }
                    ]
                  }
                ]
              }
            ]
          },
          attributes: ['propertyId', 'assignedPropertyIds']
        });

        activeReservations.forEach(res => {
          if (res.propertyId) occupiedPropertyIds.push(res.propertyId);
          if (res.assignedPropertyIds) {
            try {
              const multi = JSON.parse(res.assignedPropertyIds);
              if (Array.isArray(multi)) occupiedPropertyIds.push(...multi);
            } catch (e) {
              // ignore parse error
            }
          }
        });
      }

      // 2. Query available properties
      const whereClause: any = {
        status: 'ACTIVA'
      };

      if (occupiedPropertyIds.length > 0) {
        whereClause.id = { [Op.notIn]: occupiedPropertyIds };
      }

      if (guests && guests <= 6) {
        whereClause.capacity = { [Op.gte]: guests };
      }

      const properties = await Property.findAll({ 
        where: whereClause,
        order: [['capacity', 'ASC']]
      });

      return properties;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  app.get('/:id', {
    schema: {
      tags: ['Properties'],
      summary: 'Get property by ID',
      params: z.object({
        id: z.string()
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const property = await Property.findByPk(id);
      
      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      return property;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // CREATE PROPERTY (Admin)
  app.post('/', {
    schema: {
      tags: ['Properties'],
      summary: 'Create a new property',
      body: z.object({
        name: z.string().min(2),
        description: z.string().optional().default(''),
        capacity: z.coerce.number().min(1),
        pricePerNight: z.coerce.number().min(0),
        imageUrl: z.string().optional().default('/hero-cabanas.jpg'),
        bedrooms: z.coerce.number().optional().default(2),
        bathrooms: z.coerce.number().optional().default(1),
        status: z.enum(['ACTIVA', 'MANTENIMIENTO', 'INACTIVA']).optional().default('ACTIVA')
      })
    }
  }, async (request, reply) => {
    try {
      const property = await Property.create(request.body);
      return reply.code(201).send(property);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error creating property' });
    }
  });

  // UPDATE PROPERTY (Admin)
  app.put('/:id', {
    schema: {
      tags: ['Properties'],
      summary: 'Update property by ID',
      params: z.object({
        id: z.string()
      }),
      body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        capacity: z.coerce.number().optional(),
        pricePerNight: z.coerce.number().optional(),
        imageUrl: z.string().optional(),
        bedrooms: z.coerce.number().optional(),
        bathrooms: z.coerce.number().optional(),
        status: z.enum(['ACTIVA', 'MANTENIMIENTO', 'INACTIVA']).optional()
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const property = await Property.findByPk(id);

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      await property.update(request.body);
      return reply.send(property);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error updating property' });
    }
  });

  // DELETE PROPERTY (Admin)
  app.delete('/:id', {
    schema: {
      tags: ['Properties'],
      summary: 'Delete property by ID',
      params: z.object({
        id: z.string()
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const property = await Property.findByPk(id);

      if (!property) {
        return reply.code(404).send({ error: 'Property not found' });
      }

      await property.destroy();
      return reply.send({ success: true, message: 'Property deleted' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error deleting property' });
    }
  });
};

