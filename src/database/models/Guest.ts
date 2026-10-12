import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Reservation } from './Reservation';

@Table({
  tableName: 'guests',
  timestamps: true,
})
export class Guest extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'CC',
  })
  declare documentType: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare documentId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare fullName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare cityOrigin: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare totalStays: number;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  declare totalSpent: number;

  @Column({
    type: DataType.STRING,
    defaultValue: 'NUEVO',
  })
  declare customerTag: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;

  @HasMany(() => Reservation)
  declare reservations: Reservation[];
}
