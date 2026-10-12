import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'inquiries',
  timestamps: true,
})
export class Inquiry extends Model {
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
  declare fullName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    defaultValue: 'WIDGET_WHATSAPP',
  })
  declare channel: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare datesOfInterest: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare guestsCount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare message: string;

  @Column({
    type: DataType.ENUM('NUEVO', 'EN_SEGUIMIENTO', 'COTIZADO', 'CONVERTIDO', 'DESCARTADO'),
    defaultValue: 'NUEVO',
  })
  declare status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;
}
