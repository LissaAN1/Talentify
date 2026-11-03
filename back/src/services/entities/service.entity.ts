import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ServiceCategory {
  DESIGN = 'DESIGN',
  PROGRAMMING = 'PROGRAMMING',
  MARKETING = 'MARKETING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  VIDEO = 'VIDEO',
  WRITING = 'WRITING',
  OTHER = 'OTHER',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100 })
  title!: string;

  @Column('varchar', { length: 1000 })
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({
    type: 'enum',
    enum: ServiceCategory,
  })
  category!: ServiceCategory;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  status!: ServiceStatus;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'provider_id' })
  provider!: User;

  @OneToMany(() => Order, (order) => order.service)
  orders?: Order[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
