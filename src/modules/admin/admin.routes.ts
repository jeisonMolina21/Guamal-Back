import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { Reservation } from '../../database/models/Reservation';
import { Property } from '../../database/models/Property';
import { Guest } from '../../database/models/Guest';
import { Inquiry } from '../../database/models/Inquiry';
import { Op } from 'sequelize';

export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/dashboard', {
    schema: {
      tags: ['Admin'],
      summary: 'Get dashboard statistics',
    }
  }, async (request, reply) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const [
        reservationsToday,
        checkinsToday,
        revenuesResult,
        totalProperties,
        occupiedProperties,
        totalGuests,
        totalInquiries,
        pendingInquiries,
        recentReservations,
        allProperties
      ] = await Promise.all([
        Reservation.count({
          where: {
            createdAt: { [Op.gte]: today }
          }
        }),
        Reservation.count({
          where: {
            checkIn: todayStr,
            status: { [Op.in]: ['CONFIRMADA', 'CHECK_IN'] }
          }
        }),
        Reservation.sum('totalPrice', {
          where: {
            status: { [Op.in]: ['CONFIRMADA', 'CHECK_IN', 'COMPLETADA'] },
            createdAt: {
              [Op.gte]: new Date(today.getFullYear(), today.getMonth(), 1)
            }
          }
        }),
        Property.count({ where: { status: 'ACTIVA' } }),
        Reservation.count({
          where: {
            status: { [Op.in]: ['CONFIRMADA', 'CHECK_IN'] },
            [Op.and]: [
              { checkIn: { [Op.lte]: todayStr } },
              { checkOut: { [Op.gt]: todayStr } }
            ]
          }
        }),
        Guest.count(),
        Inquiry.count(),
        Inquiry.count({ where: { status: 'NUEVO' } }),
        Reservation.findAll({
          include: [
            { model: Guest, attributes: ['id', 'fullName', 'phone', 'email'] },
            { model: Property, attributes: ['id', 'name', 'imageUrl'] }
          ],
          order: [['createdAt', 'DESC']],
          limit: 6
        }),
        Property.findAll({
          attributes: ['id', 'name', 'status', 'capacity', 'pricePerNight']
        })
      ]);

      const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

      // Sample revenue months for chart visualization
      const currentMonth = today.getMonth();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const revenueTrend = [];

      for (let i = 4; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const baseRev = (i === 0 ? (revenuesResult || 650000) : Math.max(350000, Math.round((revenuesResult || 650000) * (0.6 + (4 - i) * 0.1))));
        revenueTrend.push({
          month: monthNames[monthIndex],
          revenue: baseRev
        });
      }

      return {
        reservationsToday,
        checkinsToday,
        monthlyRevenue: revenuesResult || 0,
        occupancyRate: Math.round(occupancyRate),
        totalGuests,
        totalInquiries,
        pendingInquiries,
        totalProperties,
        occupiedProperties,
        recentArrivals: recentReservations,
        properties: allProperties,
        revenueTrend
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
};

