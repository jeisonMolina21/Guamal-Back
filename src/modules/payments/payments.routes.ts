import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Payment } from '../../database/models/Payment';
import { Reservation } from '../../database/models/Reservation';
import { Guest } from '../../database/models/Guest';
import { Property } from '../../database/models/Property';

export const paymentsRoutes: FastifyPluginAsyncZod = async (app) => {
  // GET ALL PAYMENTS (Admin)
  app.get('/', {
    schema: {
      tags: ['Payments'],
      summary: 'Get all payments and deposit records',
    }
  }, async (request, reply) => {
    try {
      // 1. Fetch payments from payments table
      const payments = await Payment.findAll({
        include: [
          {
            model: Reservation,
            include: [
              { model: Guest, attributes: ['id', 'fullName', 'phone', 'email'] },
              { model: Property, attributes: ['id', 'name'] }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // 2. Also fetch reservations to make sure any reservations with deposits appear as payment ledger items
      const reservations = await Reservation.findAll({
        include: [
          { model: Guest, attributes: ['id', 'fullName', 'phone', 'email'] },
          { model: Property, attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Combine into a cohesive list of payment records
      const existingResIdsWithPayment = new Set(payments.map(p => p.reservationId));

      const synthesizedPayments = reservations
        .filter(r => !existingResIdsWithPayment.has(r.id))
        .map(r => ({
          id: `PAY-${r.id.substring(0, 8).toUpperCase()}`,
          reservationId: r.id,
          amount: r.depositRequired || Math.round(r.totalPrice * 0.5),
          method: 'TRANSFERENCIA',
          status: r.status === 'CONFIRMADA' || r.status === 'CHECK_IN' || r.status === 'COMPLETADA' ? 'APROBADO' : 'PENDIENTE',
          transactionId: r.reservationCode || `TX-${r.id.substring(0, 6)}`,
          receiptUrl: null,
          createdAt: r.createdAt,
          reservation: r
        }));

      return [...payments, ...synthesizedPayments];
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // CREATE PAYMENT (Admin)
  app.post('/', {
    schema: {
      tags: ['Payments'],
      summary: 'Record a new payment',
      body: z.object({
        reservationId: z.string().uuid(),
        amount: z.coerce.number().min(1),
        method: z.string().default('TRANSFERENCIA'),
        status: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO']).default('APROBADO'),
        transactionId: z.string().optional(),
        receiptUrl: z.string().optional()
      })
    }
  }, async (request, reply) => {
    try {
      const payment = await Payment.create(request.body);
      return reply.code(201).send(payment);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error recording payment' });
    }
  });

  // UPDATE PAYMENT STATUS (Admin)
  app.put('/:id/status', {
    schema: {
      tags: ['Payments'],
      summary: 'Update payment status',
      params: z.object({
        id: z.string()
      }),
      body: z.object({
        status: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO'])
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const payment = await Payment.findByPk(id);

      if (!payment) {
        return reply.code(404).send({ error: 'Payment not found' });
      }

      payment.status = request.body.status;
      await payment.save();
      return reply.send(payment);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Error updating payment status' });
    }
  });
};
