import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { City } from './city.entity';

@Entity('basement_rules')
export class BasementRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'city_id', length: 50 })
  cityId: string;

  @ManyToOne(() => City, (city) => city.basementRules)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ type: 'boolean', default: true })
  allowed: boolean;

  @Column({ name: 'counted_in_far', type: 'boolean', default: false })
  countedInFar: boolean;

  @Column({ name: 'max_levels', type: 'int', default: 1 })
  maxLevels: number;

  @Column({
    name: 'min_height',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 2.4,
  })
  minHeight: number;

  @Column({
    name: 'max_height',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 4.0,
  })
  maxHeight: number;

  @Column({ name: 'allowed_uses', type: 'text', array: true, default: '{}' })
  allowedUses: string[];

  @Column({
    name: 'max_coverage_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  maxCoveragePercent: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
