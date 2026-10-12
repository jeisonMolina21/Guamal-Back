import { sequelize } from './sequelize';
import { Property } from './models/Property';
import { SystemSetting } from './models/SystemSetting';
import { Package } from './models/Package';
import { Inquiry } from './models/Inquiry';
import { Guest } from './models/Guest';
import { Reservation } from './models/Reservation';

export async function runSeed() {
  try {
    console.log('🌱 Iniciando siembra (seed) de datos para villa_mcj...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // 1. Properties
    const propertyCount = await Property.count();
    if (propertyCount === 0) {
      console.log('📌 Insertando cabañas iniciales...');
      await Property.bulkCreate([
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Casa Ceiba',
          description: 'Hermosa cabaña prefabricada con vista al jardín, terraza privada con hamacas, aire acondicionado y cocina dotada.',
          capacity: 4,
          bedrooms: 2,
          bathrooms: 1,
          pricePerNight: 180000,
          imageUrl: '/hero-cabanas.jpg',
          status: 'ACTIVA',
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Casa Samán',
          description: 'Espaciosa y fresca, perfecta para familias o grupos de amigos en busca de descanso profundo y confort.',
          capacity: 5,
          bedrooms: 2,
          bathrooms: 1,
          pricePerNight: 200000,
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
          status: 'ACTIVA',
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Casa Moriche',
          description: 'La cabaña más amplia del mini barrio, con tres habitaciones, dos baños y zona BBQ privada.',
          capacity: 6,
          bedrooms: 3,
          bathrooms: 2,
          pricePerNight: 250000,
          imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800&auto=format&fit=crop',
          status: 'ACTIVA',
        },
      ]);
      console.log('✅ 3 Cabañas creadas');
    }

    // 2. System Settings (Parámetros)
    const settingsCount = await SystemSetting.count();
    if (settingsCount === 0) {
      console.log('📌 Insertando parámetros del sistema...');
      await SystemSetting.bulkCreate([
        {
          key: 'whatsapp_number',
          value: '+57 300 123 4567',
          category: 'CONTACTO',
          label: 'Número de WhatsApp Oficial',
          description: 'Línea de atención y recepción de comprobantes de pago',
          isPublic: true,
        },
        {
          key: 'whatsapp_welcome_msg',
          value: 'Hola, quisiera asesoría para reservar en Guamal Mini Barrio.',
          category: 'CONTACTO',
          label: 'Mensaje Predeterminado de WhatsApp',
          description: 'Texto que se carga automáticamente al abrir el chat',
          isPublic: true,
        },
        {
          key: 'min_deposit_percentage',
          value: '50',
          category: 'RESERVAS',
          label: 'Porcentaje de Anticipo Mínimo (%)',
          description: 'Porcentaje del total necesario para confirmar la reserva',
          isPublic: true,
        },
        {
          key: 'check_in_time',
          value: '15:00',
          category: 'HORARIOS',
          label: 'Hora de Check-in',
          description: 'Hora a partir de la cual el huésped puede ingresar',
          isPublic: true,
        },
        {
          key: 'check_out_time',
          value: '13:00',
          category: 'HORARIOS',
          label: 'Hora de Check-out',
          description: 'Hora límite de entrega de la cabaña',
          isPublic: true,
        },
        {
          key: 'payment_bancolombia',
          value: 'Ahorros Bancolombia No. 123-456789-01 a nombre de Guamal Mini Barrio SAS (NIT 901.234.567)',
          category: 'PAGOS',
          label: 'Cuenta Bancolombia',
          description: 'Datos bancarios oficiales para consignaciones',
          isPublic: false,
        },
        {
          key: 'payment_nequi_daviplata',
          value: 'Nequi / Daviplata: 300 123 4567',
          category: 'PAGOS',
          label: 'Billeteras Digitales (Nequi / Daviplata)',
          description: 'Línea autorizada para pagos móviles inmediatos',
          isPublic: false,
        },
        {
          key: 'hostal_address',
          value: 'Sector Campestre Vía Humadea, Guamal, Meta, Colombia',
          category: 'GENERAL',
          label: 'Dirección Física',
          description: 'Ubicación física del predio campestre',
          isPublic: true,
        },
      ]);
      console.log('✅ Parámetros del sistema inicializados');
    }

    // 3. Packages & Offers (Paquetes y Ofertas)
    const packageCount = await Package.count();
    if (packageCount === 0) {
      console.log('📌 Insertando paquetes y ofertas...');
      await Package.bulkCreate([
        {
          title: 'Mini Barrio Exclusivo Completo',
          slug: 'mini-barrio-completo',
          description: 'Alquila las 3 casas de forma 100% privada para tu grupo familiar o empresarial de hasta 15 personas. Piscina, BBQ y jardines exclusivamente para ustedes.',
          discountPercentage: 15,
          fixedPrice: 535000,
          minNights: 1,
          minGuests: 10,
          isActive: true,
        },
        {
          title: 'Plan Escapada Entre Semana (3x2)',
          slug: 'plan-3x2-semana',
          description: 'Quédate 3 noches de domingo a jueves y paga solo 2 noches en cualquiera de nuestras casas.',
          discountPercentage: 33,
          minNights: 3,
          minGuests: 2,
          isActive: true,
        },
      ]);
      console.log('✅ Paquetes y ofertas inicializadas');
    }

    // 4. Inquiries / Leads (Prospectos que preguntaron)
    const inquiryCount = await Inquiry.count();
    if (inquiryCount === 0) {
      console.log('📌 Insertando prospectos de ejemplo...');
      await Inquiry.bulkCreate([
        {
          fullName: 'Carlos Rodríguez',
          phone: '+57 310 987 6543',
          email: 'carlos.rodriguez@gmail.com',
          channel: 'WIDGET_WHATSAPP',
          datesOfInterest: 'Próximo fin de semana festivo',
          guestsCount: 6,
          message: 'Hola, buenas tardes. ¿Tienen disponibilidad de la Casa Moriche para 6 personas? ¿Aceptan un perrito pequeño?',
          status: 'NUEVO',
          notes: 'Interesado en Casa Moriche. Confirmar política pet friendly.',
        },
        {
          fullName: 'Diana Marcela Gómez',
          phone: '+57 320 555 1234',
          email: 'diana.gomez@hotmail.com',
          channel: 'FORMULARIO_CONTACTO',
          datesOfInterest: '15 al 18 de Noviembre',
          guestsCount: 12,
          message: 'Buenas tardes, quisiéramos saber el precio para alquilar todas las casas para una integración familiar.',
          status: 'COTIZADO',
          notes: 'Se le envió cotización del paquete Mini Barrio Completo con 15% de descuento.',
        },
      ]);
      console.log('✅ Prospectos / Leads inicializados');
    }

    console.log('🎉 Siembra completada con éxito en MariaDB (villa_mcj)');
  } catch (error) {
    console.error('❌ Error en seed:', error);
  }
}

// Execute directly when run via CLI
if (require.main === module) {
  runSeed().then(() => process.exit(0));
}
