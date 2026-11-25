import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Una orden solo puede calificarse una vez
  @OneToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'provider_id' })
  provider!: User;

  @Column('int')
  score!: number;

  @Column('varchar', { length: 500, nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
