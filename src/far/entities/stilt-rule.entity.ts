import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { City } from './city.entity';

@Entity('stilt_rules')
export class StiltRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'city_id', length: 50 })
  cityId: string;

  @ManyToOne(() => City, (city) => city.stiltRules)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ type: 'boolean', default: true })
  allowed: boolean;

  @Column({ name: 'counted_in_far', type: 'boolean', default: false })
  countedInFar: boolean;

  @Column({
    name: 'min_height',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 2.4,
  })
  minHeight: number;

  @Column({ type: 'boolean', default: false })
  mandatory: boolean;

  @Column({
    name: 'mandatory_above_plot_size',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  mandatoryAbovePlotSize: number;

  @Column({ name: 'mandatory_above_floors', type: 'int', nullable: true })
  mandatoryAboveFloors: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
