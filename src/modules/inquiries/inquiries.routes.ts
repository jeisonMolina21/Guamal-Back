import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Inquiry } from '../../database/models/Inquiry';

export const inquiriesRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get all inquiries (for CRM/Admin)
  app.get('/', {
    schema: {
      tags: ['Inquiries'],
      summary: 'Get all inquiries and prospective leads',
      querystring: z.object({
        status: z.string().optional(),
        channel: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { status, channel } = request.query;
      const where: any = {};
      if (status) where.status = status;
      if (channel) where.channel = channel;

      const inquiries = await Inquiry.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });
      return inquiries;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch inquiries' });
    }
  });

  // Create a new inquiry (e.g. from WhatsApp widget or contact form)
  app.post('/', {
    schema: {
      tags: ['Inquiries'],
      summary: 'Create a new prospective lead or inquiry',
      body: z.object({
        fullName: z.string().min(2),
        phone: z.string().min(7),
        email: z.string().email().optional().or(z.literal('')),
        channel: z.string().default('WIDGET_WHATSAPP'),
        datesOfInterest: z.string().optional(),
        guestsCount: z.number().int().optional(),
        message: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { fullName, phone, email, channel, datesOfInterest, guestsCount, message } = request.body;

      const inquiry = await Inquiry.create({
        fullName,
        phone,
        email: email || null,
        channel: channel || 'WIDGET_WHATSAPP',
        datesOfInterest: datesOfInterest || null,
        guestsCount: guestsCount || null,
        message: message || null,
        status: 'NUEVO',
      });

      return reply.code(201).send({ success: true, inquiry });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to create inquiry' });
    }
  });

  // Update inquiry status or notes
  app.put('/:id', {
    schema: {
      tags: ['Inquiries'],
      summary: 'Update status or notes for an inquiry',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        status: z.enum(['NUEVO', 'EN_SEGUIMIENTO', 'COTIZADO', 'CONVERTIDO', 'DESCARTADO']).optional(),
        notes: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, notes } = request.body;

      const inquiry = await Inquiry.findByPk(id);
      if (!inquiry) {
        return reply.code(404).send({ error: 'Inquiry not found' });
      }

      if (status) inquiry.status = status;
      if (notes !== undefined) inquiry.notes = notes;
      await inquiry.save();

      return { success: true, inquiry };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update inquiry' });
    }
  });
};
