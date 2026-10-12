import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env';
import { Property } from './models/Property';
import { Guest } from './models/Guest';
import { Reservation } from './models/Reservation';
import { Payment } from './models/Payment';
import { SystemSetting } from './models/SystemSetting';
import { Package } from './models/Package';
import { Inquiry } from './models/Inquiry';
import { User } from './models/User';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
  models: [
    Property,
    Guest,
    Reservation,
    Payment,
    SystemSetting,
    Package,
    Inquiry,
    User
  ],
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos MariaDB (villa_mcj) conectada exitosamente via Sequelize');
    
    // Sync schemas (without alter for fast startup)
    await sequelize.sync();
    console.log('✅ Modelos de Sequelize sincronizados en villa_mcj');
  } catch (error) {
    console.error('❌ Error conectando a Sequelize:', error);
    process.exit(1);
  }
};
