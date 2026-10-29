import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppRoles } from '../../auth/interfaces/app-roles';
import { Service } from '../../services/entities/service.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar')
  name!: string;

  @Column('varchar', { unique: true })
  email!: string;

  @Column('varchar', { select: false })
  password!: string;

  @Column('varchar', { array: true, default: [AppRoles.CLIENT] })
  roles!: AppRoles[];

  @Column('bool', { default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column('varchar', { nullable: true, name: 'refresh_token' })
  refreshToken!: string | null;

  @Column({ default: false })
  isTwoFactorEnabled?: boolean;

  @Column({ nullable: true })
  twoFactorSecret?: string;

  @OneToMany(() => Service, (service) => service.provider)
  services?: Service[];

  @OneToMany(() => Order, (order) => order.user)
  orders?: Order[];
}
