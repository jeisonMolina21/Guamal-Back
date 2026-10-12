import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type UserRole = 'USUARIO' | 'RECEPCIONISTA' | 'ADMINISTRADOR' | 'SUPERADMIN';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
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
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare passwordHash: string;

  @Column({
    type: DataType.ENUM('USUARIO', 'RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN'),
    defaultValue: 'USUARIO',
    allowNull: false,
  })
  declare role: UserRole;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastLogin: Date | null;
}
