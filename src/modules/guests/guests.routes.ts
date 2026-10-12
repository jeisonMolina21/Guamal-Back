import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Guest } from '../../database/models/Guest';
import { Reservation } from '../../database/models/Reservation';

export const guestsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', {
    schema: {
      tags: ['Guests'],
      summary: 'Get all guests with their reservations',
    }
  }, async (request, reply) => {
    try {
      const guests = await Guest.findAll({
        include: [{ model: Reservation }],
        order: [['createdAt', 'DESC']]
      });
      return guests;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  app.get('/:id', {
    schema: {
      tags: ['Guests'],
      summary: 'Get guest by ID',
      params: z.object({
        id: z.string().uuid()
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const guest = await Guest.findByPk(id, {
        include: [{ model: Reservation }]
      });
      
      if (!guest) {
        return reply.code(404).send({ error: 'Guest not found' });
      }

      return guest;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // CREATE GUEST (Admin)
  app.post('/', {
    schema: {
      tags: ['Guests'],
      summary: 'Create a new guest manually',
      body: z.object({
        fullName: z.string().min(2),
        phone: z.string().min(5),
        email: z.string().email().optional().or(z.literal('')),
        documentType: z.string().optional().default('CC'),
        documentId: z.string().optional(),
        cityOrigin: z.string().optional(),
        notes: z.string().optional(),
        customerTag: z.string().optional().default('NUEVO')
      })
    }
  }, async (request, reply) => {
    try {
      const guest = await Guest.create(request.body);
      return reply.code(201).send(guest);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error creating guest' });
    }
  });

  // UPDATE GUEST (Admin)
  app.put('/:id', {
    schema: {
      tags: ['Guests'],
      summary: 'Update guest by ID',
      params: z.object({
        id: z.string().uuid()
      }),
      body: z.object({
        fullName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        documentType: z.string().optional(),
        documentId: z.string().optional(),
        cityOrigin: z.string().optional(),
        customerTag: z.string().optional(),
        notes: z.string().optional(),
        totalStays: z.coerce.number().optional(),
        totalSpent: z.coerce.number().optional()
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const guest = await Guest.findByPk(id);

      if (!guest) {
        return reply.code(404).send({ error: 'Guest not found' });
      }

      await guest.update(request.body);
      return reply.send(guest);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error updating guest' });
    }
  });

  // DELETE GUEST (Admin)
  app.delete('/:id', {
    schema: {
      tags: ['Guests'],
      summary: 'Delete guest by ID',
      params: z.object({
        id: z.string().uuid()
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const guest = await Guest.findByPk(id);

      if (!guest) {
        return reply.code(404).send({ error: 'Guest not found' });
      }

      await guest.destroy();
      return reply.send({ success: true, message: 'Guest deleted' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error deleting guest' });
    }
  });
};

