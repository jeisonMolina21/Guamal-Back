import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const uploadRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/', {
    schema: {
      tags: ['Upload'],
      summary: 'Upload an image for a house/property and save locally to public/uploads',
      body: z.object({
        filename: z.string(),
        data: z.string(), // Base64 data or Data URL
        houseName: z.string().optional(),
      })
    }
  }, async (request, reply) => {
    try {
      const { filename, data, houseName } = request.body;

      // Extract file extension
      let ext = path.extname(filename).toLowerCase() || '.jpg';
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        ext = '.jpg';
      }

      // Generate slug filename based on house name
      let baseSlug = 'propiedad';
      if (houseName && houseName.trim()) {
        baseSlug = houseName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // remove accents
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      const finalFileName = `${baseSlug || 'casa'}${ext}`;

      // Clean base64 string
      const base64Data = data.includes(';base64,')
        ? data.split(';base64,')[1]
        : data;

      const buffer = Buffer.from(base64Data, 'base64');

      // Define destination paths in Frontend
      // 1. Primary public folder for Astro serving
      const frontPublicUploads = path.resolve(process.cwd(), '../Front/public/uploads');
      // 2. Secondary src/public/uploads as requested by user
      const frontSrcPublicUploads = path.resolve(process.cwd(), '../Front/src/public/uploads');

      // Ensure both directories exist
      if (!fs.existsSync(frontPublicUploads)) {
        fs.mkdirSync(frontPublicUploads, { recursive: true });
      }
      if (!fs.existsSync(frontSrcPublicUploads)) {
        fs.mkdirSync(frontSrcPublicUploads, { recursive: true });
      }

      // Write to both locations so they stay in sync
      const filePath1 = path.join(frontPublicUploads, finalFileName);
      const filePath2 = path.join(frontSrcPublicUploads, finalFileName);

      await Promise.all([
        fs.promises.writeFile(filePath1, buffer),
        fs.promises.writeFile(filePath2, buffer)
      ]);

      const publicUrl = `/uploads/${finalFileName}`;

      return reply.code(201).send({
        success: true,
        url: publicUrl,
        filename: finalFileName,
        message: `Imagen guardada exitosamente como ${finalFileName}`
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        error: error.message || 'Error al guardar la imagen en el servidor'
      });
    }
  });
};
