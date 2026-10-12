import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Reservation } from './Reservation';

@Table({
  tableName: 'payments',
  timestamps: true,
})
export class Payment extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Reservation)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare reservationId: string;

  @BelongsTo(() => Reservation)
  declare reservation: Reservation;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare amount: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'NEQUI',
  })
  declare method: string;

  @Column({
    type: DataType.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO'),
    defaultValue: 'PENDIENTE',
  })
  declare status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare transactionId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare receiptUrl: string;
}
