import { FastifyPluginAsync } from 'fastify';
import { SystemSetting } from '../../database/models/SystemSetting';

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  // Public settings (for frontend web)
  app.get('/public', async (request, reply) => {
    try {
      const settings = await SystemSetting.findAll();
      const dict: Record<string, string> = {};
      settings.forEach(s => {
        const isPub = (s as any).isPublic;
        if (isPub === true || isPub === 1 || isPub === '1' || isPub === 'true') {
          dict[s.key] = s.value;
        }
      });
      return dict;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch public settings' });
    }
  });

  // All settings (for admin panel)
  app.get('/', async (request, reply) => {
    try {
      const settings = await SystemSetting.findAll({ order: [['category', 'ASC']] });
      return settings;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // Update a setting by key
  app.put('/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string };
      const { value } = request.body as { value: string };

      const setting = await SystemSetting.findOne({ where: { key } });
      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found' });
      }

      setting.value = value;
      await setting.save();

      return { success: true, setting };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to update setting' });
    }
  });
};
