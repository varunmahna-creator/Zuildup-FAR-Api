import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { City } from './city.entity';

@Entity('road_width_rules')
export class RoadWidthRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'city_id', length: 50 })
  cityId: string;

  @ManyToOne(() => City, (city) => city.roadWidthRules)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'min_road_width', type: 'decimal', precision: 5, scale: 2 })
  minRoadWidth: number;

  @Column({
    name: 'max_road_width',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  maxRoadWidth: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  far: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
