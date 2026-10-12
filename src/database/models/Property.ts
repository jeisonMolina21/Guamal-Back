import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Reservation } from './Reservation';

@Table({
  tableName: 'properties',
  timestamps: true,
})
export class Property extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
  })
  declare description: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare capacity: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare pricePerNight: number;

  @Column({
    type: DataType.STRING,
  })
  declare imageUrl: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 2,
  })
  declare bedrooms: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare bathrooms: number;

  @Column({
    type: DataType.ENUM('ACTIVA', 'MANTENIMIENTO', 'INACTIVA'),
    defaultValue: 'ACTIVA',
  })
  declare status: string;

  @HasMany(() => Reservation)
  declare reservations: Reservation[];
}
