import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'system_settings',
  timestamps: true,
})
export class SystemSetting extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare key: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare value: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'GENERAL',
  })
  declare category: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare label: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isPublic: boolean;
}
