import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized: Invalid or missing token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { role: string; id: string };

      if (!allowedRoles.includes(user.role)) {
        reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized: Invalid or missing token' });
    }
  };
}

// Module augmentation for Fastify JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: string; email: string };
    user: { id: string; role: string; email: string };
  }
}
