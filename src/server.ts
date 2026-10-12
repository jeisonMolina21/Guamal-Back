import { buildApp } from './app';
import { env } from './config/env';
import { connectDB } from './database/sequelize';

async function start() {
  try {
    await connectDB();
    const app = await buildApp();
    
    await app.listen({ port: env.PORT, host: env.HOST });
    
    app.log.info(`Server is running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`Swagger documentation available at http://${env.HOST}:${env.PORT}/docs`);
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
