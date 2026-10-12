import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Property } from './Property';
import { Guest } from './Guest';
import { Payment } from './Payment';

@Table({
  tableName: 'reservations',
  timestamps: true,
})
export class Reservation extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare reservationCode: string;

  @ForeignKey(() => Property)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare propertyId: string;

  @BelongsTo(() => Property)
  declare property: Property;

  @ForeignKey(() => Guest)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare guestId: string;

  @BelongsTo(() => Guest)
  declare guest: Guest;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare checkIn: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare checkOut: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare guestsCount: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare totalPrice: number;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  declare depositRequired: number;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  declare balanceDue: number;

  @Column({
    type: DataType.ENUM('PENDIENTE', 'CONFIRMADA', 'CHECK_IN', 'COMPLETADA', 'CANCELADA'),
    defaultValue: 'PENDIENTE',
  })
  declare status: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'WEB_DIRECT',
  })
  declare source: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare expiresAt: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare assignedPropertyIds: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;

  @HasMany(() => Payment)
  declare payments: Payment[];
}
