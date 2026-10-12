import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User, type UserRole } from '../../database/models/User';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  // Login endpoint
  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login user with email and password',
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
        });
      }

      if (!user.isActive) {
        return reply.code(403).send({
          success: false,
          error: 'Tu cuenta se encuentra inactiva. Contacta al administrador.'
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return reply.code(401).send({
          success: false,
          error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Sign JWT
      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }, { expiresIn: '7d' });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false, error: 'Error interno del servidor' });
    }
  });

  // Get current user profile
  app.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Get currently authenticated user',
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as { id: string; email: string; role: UserRole };
      
      const user = await User.findByPk(payload.id, {
        attributes: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt']
      });

      if (!user) {
        return reply.code(404).send({ error: 'Usuario no encontrado' });
      }

      return { success: true, user };
    } catch (err) {
      return reply.code(401).send({ error: 'No autorizado' });
    }
  });
};
