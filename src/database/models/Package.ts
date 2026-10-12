import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'packages',
  timestamps: true,
})
export class Package extends Model {
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
  declare title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  declare discountPercentage: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  declare fixedPrice: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare minNights: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare minGuests: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare startDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare endDate: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare bannerImage: string;
}
