import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User, type UserRole } from '../../database/models/User';
import { requireRole } from '../../middleware/auth';

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  // SUPERADMIN and ADMINISTRADOR can view users
  app.get('/', {
    preHandler: [requireRole(['SUPERADMIN', 'ADMINISTRADOR'])],
    schema: {
      tags: ['Users'],
      summary: 'Get all users and staff',
    }
  }, async (request, reply) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
      return users;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Create new staff or user (SUPERADMIN and ADMINISTRADOR)
  app.post('/', {
    preHandler: [requireRole(['SUPERADMIN', 'ADMINISTRADOR'])],
    schema: {
      tags: ['Users'],
      summary: 'Create a new user/staff member',
      body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['USUARIO', 'RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN']).default('RECEPCIONISTA'),
      })
    }
  }, async (request, reply) => {
    try {
      const { name, email, password, role } = request.body;

      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) {
        return reply.code(400).send({ error: 'Ya existe un usuario con este correo electrónico.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role as UserRole,
        isActive: true,
      });

      return reply.code(201).send({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to create user' });
    }
  });

  // Update user role (SUPERADMIN & ADMINISTRADOR)
  app.put('/:id/role', {
    preHandler: [requireRole(['SUPERADMIN', 'ADMINISTRADOR'])],
    schema: {
      tags: ['Users'],
      summary: 'Update user role',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        role: z.enum(['USUARIO', 'RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN']),
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { role } = request.body;
      const currentUser = request.user as { role: string; id: string };

      const user = await User.findByPk(id);
      if (!user) {
        return reply.code(404).send({ error: 'Usuario no encontrado' });
      }

      if (user.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
        return reply.code(403).send({ error: 'Solo un Superadmin puede modificar a otro Superadmin.' });
      }

      if (role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
        return reply.code(403).send({ error: 'Solo un Superadmin puede asignar el rol de Superadmin.' });
      }

      user.role = role as UserRole;
      await user.save();

      return { success: true, message: `Rol actualizado a ${role}`, user };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update user role' });
    }
  });

  // Activate / Deactivate user (SUPERADMIN & ADMINISTRADOR)
  app.put('/:id/status', {
    preHandler: [requireRole(['SUPERADMIN', 'ADMINISTRADOR'])],
    schema: {
      tags: ['Users'],
      summary: 'Activate or deactivate user',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        isActive: z.boolean(),
      })
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { isActive } = request.body;
      const currentUser = request.user as { role: string; id: string };

      const user = await User.findByPk(id);
      if (!user) {
        return reply.code(404).send({ error: 'Usuario no encontrado' });
      }

      if (user.id === currentUser.id) {
        return reply.code(400).send({ error: 'No puedes desactivar tu propia cuenta.' });
      }

      if (user.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
        return reply.code(403).send({ error: 'Solo un Superadmin puede modificar el estado de un Superadmin.' });
      }

      user.isActive = isActive;
      await user.save();

      return { success: true, message: `Estado actualizado a ${isActive ? 'Activo' : 'Inactivo'}`, user };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update user status' });
    }
  });

  // Delete user (SUPERADMIN & ADMINISTRADOR)
  app.delete('/:id', {
    preHandler: [requireRole(['SUPERADMIN', 'ADMINISTRADOR'])],
    schema: {
      tags: ['Users'],
      summary: 'Delete user',
      params: z.object({ id: z.string().uuid() }),
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const currentUser = request.user as { role: string; id: string };

      const user = await User.findByPk(id);
      if (!user) {
        return reply.code(404).send({ error: 'Usuario no encontrado' });
      }

      if (user.id === currentUser.id) {
        return reply.code(400).send({ error: 'No puedes eliminar tu propia cuenta.' });
      }

      if (user.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
        return reply.code(403).send({ error: 'Solo un Superadmin puede eliminar a un Superadmin.' });
      }

      await user.destroy();
      return { success: true, message: 'Usuario eliminado exitosamente' };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });
};
