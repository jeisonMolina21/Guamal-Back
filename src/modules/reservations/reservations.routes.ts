import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { sequelize } from '../../database/sequelize';
import { Property } from '../../database/models/Property';
import { Guest } from '../../database/models/Guest';
import { Reservation } from '../../database/models/Reservation';
import { Payment } from '../../database/models/Payment';
import { Op, Transaction } from 'sequelize';

export const reservationsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get all reservations with Property and Guest
  app.get('/', {
    schema: {
      tags: ['Reservations'],
      summary: 'Get all reservations',
      querystring: z.object({
        status: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { status } = request.query;
      const where: any = {};
      if (status) where.status = status;

      const reservations = await Reservation.findAll({
        where,
        include: [
          { model: Property },
          { model: Guest },
          { model: Payment }
        ],
        order: [['createdAt', 'DESC']]
      });
      return reservations;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get reservation by ID or code
  app.get('/:identifier', {
    schema: {
      tags: ['Reservations'],
      summary: 'Get reservation by ID or Reservation Code',
      params: z.object({
        identifier: z.string()
      })
    }
  }, async (request, reply) => {
    try {
      const { identifier } = request.params;
      let res = await Reservation.findOne({
        where: { reservationCode: identifier },
        include: [{ model: Property }, { model: Guest }, { model: Payment }]
      });
      if (!res) {
        res = await Reservation.findByPk(identifier, {
          include: [{ model: Property }, { model: Guest }, { model: Payment }]
        });
      }
      if (!res) {
        return reply.code(404).send({ error: 'Reservation not found' });
      }
      return res;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Create a new reservation with STRICT ATOMIC CONCURRENCY & PESSIMISTIC LOCKING
  app.post('/', {
    schema: {
      tags: ['Reservations'],
      summary: 'Create a new reservation with concurrency control and multi-property support',
      body: z.object({
        propertyId: z.string().optional(),
        propertyIds: z.array(z.string()).optional(),
        checkInDate: z.string(), // YYYY-MM-DD
        checkOutDate: z.string(), // YYYY-MM-DD
        guestsCount: z.number().int().min(1).max(20),
        source: z.string().default('WEB_DIRECT'),
        notes: z.string().optional(),
        guest: z.object({
          name: z.string().min(2),
          email: z.string().email(),
          phone: z.string().min(7),
          documentId: z.string().optional(),
          cityOrigin: z.string().optional(),
        })
      })
    }
  }, async (request, reply) => {
    const { propertyId, propertyIds, checkInDate, checkOutDate, guestsCount, guest, source, notes } = request.body;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return reply.code(400).send({ 
        code: 'INVALID_DATES',
        error: 'La fecha de salida debe ser posterior a la fecha de llegada' 
      });
    }

    const checkInStr = checkInDate.split('T')[0];
    const checkOutStr = checkOutDate.split('T')[0];
    const now = new Date();

    try {
      // Execute inside an isolated transaction with row-level locks
      const result = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
      }, async (t) => {
        
        // 1. Determine target property IDs
        let targetIds: string[] = [];
        if (propertyIds && propertyIds.length > 0) {
          targetIds = propertyIds;
        } else if (propertyId) {
          targetIds = [propertyId];
        } else {
          // If no specific property requested, find active properties
          const allProps = await Property.findAll({
            where: { status: 'ACTIVA' },
            order: [['capacity', 'DESC']],
            transaction: t,
            lock: t.LOCK.UPDATE
          });
          targetIds = allProps.map(p => p.id);
        }

        // 2. Fetch and LOCK the target properties
        const lockedProperties = await Property.findAll({
          where: { id: targetIds, status: 'ACTIVA' },
          transaction: t,
          lock: t.LOCK.UPDATE // PESSIMISTIC LOCK: Other transactions wait here
        });

        if (lockedProperties.length === 0) {
          throw { status: 404, code: 'PROPERTY_NOT_FOUND', message: 'No se encontraron las propiedades seleccionadas.' };
        }

        // Calculate combined capacity of the selected properties
        const totalCapacity = lockedProperties.reduce((acc, p) => acc + p.capacity, 0);

        // If guestsCount exceeds single property, auto-combine if needed
        if (totalCapacity < guestsCount) {
          // Check if there are other available active properties to combine
          const additionalProps = await Property.findAll({
            where: { 
              status: 'ACTIVA',
              id: { [Op.notIn]: targetIds }
            },
            order: [['capacity', 'DESC']],
            transaction: t,
            lock: t.LOCK.UPDATE
          });

          for (const extra of additionalProps) {
            if (targetIds.length < 3 && (lockedProperties.reduce((acc, p) => acc + p.capacity, 0)) < guestsCount) {
              lockedProperties.push(extra);
              targetIds.push(extra.id);
            }
          }

          const newTotalCapacity = lockedProperties.reduce((acc, p) => acc + p.capacity, 0);
          if (newTotalCapacity < guestsCount) {
            throw {
              status: 400,
              code: 'CAPACITY_EXCEEDED',
              message: `El aforo máximo total de las cabañas seleccionadas es de ${newTotalCapacity} personas (solicitaste ${guestsCount}).`
            };
          }
        }

        // 3. CHECK OVERLAPPING RESERVATIONS WITH LOCK
        // Only active reservations (CONFIRMADA, CHECK_IN) OR non-expired PENDIENTE (hold < 30 mins)
        const overlappingReservations = await Reservation.findAll({
          where: {
            [Op.and]: [
              { checkIn: { [Op.lt]: checkOutStr } },
              { checkOut: { [Op.gt]: checkInStr } },
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
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        // Verify if any of the target properties is occupied
        for (const res of overlappingReservations) {
          const resOccupiedIds = [res.propertyId];
          if (res.assignedPropertyIds) {
            try {
              const extraIds = JSON.parse(res.assignedPropertyIds);
              if (Array.isArray(extraIds)) resOccupiedIds.push(...extraIds);
            } catch (e) {}
          }

          const conflict = targetIds.some(id => resOccupiedIds.includes(id));
          if (conflict) {
            throw {
              status: 409,
              code: 'DATES_ALREADY_BOOKED',
              message: 'Lo sentimos, las cabañas seleccionadas acaban de ser reservadas para estas fechas por otro huésped mientras completabas tus datos.'
            };
          }
        }

        // 4. UPSERT GUEST RECORD
        const fullName = guest.name.trim();
        const [guestRecord] = await Guest.findOrCreate({
          where: { email: guest.email },
          defaults: {
            fullName,
            phone: guest.phone,
            email: guest.email,
            documentId: guest.documentId || null,
            cityOrigin: guest.cityOrigin || null,
            customerTag: 'HUESPED',
          },
          transaction: t
        });

        guestRecord.fullName = fullName;
        guestRecord.phone = guest.phone;
        if (guest.documentId) guestRecord.documentId = guest.documentId;
        if (guest.cityOrigin) guestRecord.cityOrigin = guest.cityOrigin;
        guestRecord.totalStays = (guestRecord.totalStays || 0) + 1;
        await guestRecord.save({ transaction: t });

        // 5. CALCULATE NIGHTS & PRICING
        const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        const pricePerNightTotal = lockedProperties.reduce((sum, p) => sum + Number(p.pricePerNight), 0);
        const totalPrice = pricePerNightTotal * nights;
        const depositRequired = Math.round(totalPrice * 0.5); // 50% anticipo

        // 6. GENERATE CODE & SET 30-MINUTE HOLD EXPIRATION
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        const reservationCode = `VMCJ-${codeSuffix}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins hold

        const primaryPropertyId = lockedProperties[0].id;
        const assignedIds = targetIds.length > 1 ? JSON.stringify(targetIds) : null;

        const newReservation = await Reservation.create({
          reservationCode,
          propertyId: primaryPropertyId,
          assignedPropertyIds: assignedIds,
          guestId: guestRecord.id,
          status: 'PENDIENTE',
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guestsCount,
          totalPrice,
          depositRequired,
          balanceDue: totalPrice,
          expiresAt,
          source: source || 'WEB_DIRECT',
          notes: notes || (targetIds.length > 1 ? `Reserva Multi-Cabaña (${lockedProperties.map(p => p.name).join(' + ')})` : null),
        }, { transaction: t });

        return {
          newReservation,
          assignedHouses: lockedProperties.map(p => p.name),
        };
      });

      return reply.code(201).send({
        success: true,
        message: 'Reserva creada exitosamente',
        reservationId: result.newReservation.id,
        reservationCode: result.newReservation.reservationCode,
        assignedHouses: result.assignedHouses,
        reservation: result.newReservation
      });
    } catch (err: any) {
      request.log.error(err);
      const statusCode = err.status || 400;
      return reply.code(statusCode).send({ 
        success: false,
        code: err.code || 'RESERVATION_FAILED',
        error: err.message || 'Error al procesar la reserva' 
      });
    }
  });

  // Update reservation status (Admin)
  app.put('/:id/status', {
    schema: {
      tags: ['Reservations'],
      summary: 'Update reservation status',
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        status: z.enum(['PENDIENTE', 'CONFIRMADA', 'CHECK_IN', 'COMPLETADA', 'CANCELADA']),
        notes: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, notes } = request.body;

      const reservation = await Reservation.findByPk(id);
      if (!reservation) {
        return reply.code(404).send({ error: 'Reservation not found' });
      }

      reservation.status = status;
      if (notes !== undefined) reservation.notes = notes;
      await reservation.save();

      return { success: true, reservation };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
};
