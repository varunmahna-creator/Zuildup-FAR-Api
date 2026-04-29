import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { City } from './city.entity';

@Entity('plot_size_rules')
export class PlotSizeRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'city_id', length: 50 })
  cityId: string;

  @ManyToOne(() => City, (city) => city.plotSizeRules)
  @JoinColumn({ name: 'city_id' })
  city: City;

  // Sub-zone: optional. Used for Ghaziabad ("developed" / "new_development").
  // Null for cities that don't split.
  @Column({ name: 'sub_zone', length: 50, nullable: true })
  subZone: string | null;

  @Column({
    name: 'min_size_sqm',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  minSizeSqm: number;

  @Column({
    name: 'max_size_sqm',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxSizeSqm: number | null;

  // Total FAR (Real + Purchasable). This is the buildable cap.
  // Kept as `far` for backward compatibility with existing API consumers.
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  far: number;

  // Real FAR — the FAR allowed by base bylaws without payment.
  @Column({
    name: 'real_far',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  realFar: number;

  // Purchasable FAR — additional FAR purchasable from authority.
  @Column({
    name: 'purchasable_far',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  purchasableFar: number;

  @Column({
    name: 'ground_coverage',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  groundCoverage: number;

  @Column({ name: 'max_dwelling_units', type: 'int', nullable: true })
  maxDwellingUnits: number;

  // Setbacks in meters
  @Column({
    name: 'setback_front',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  setbackFront: number;

  @Column({
    name: 'setback_rear',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  setbackRear: number;

  @Column({
    name: 'setback_side1',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  setbackSide1: number;

  @Column({
    name: 'setback_side2',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  setbackSide2: number;

  @Column({ name: 'max_height', type: 'decimal', precision: 5, scale: 2 })
  maxHeight: number;

  @Column({ name: 'max_floors', type: 'int' })
  maxFloors: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Helper method to get setbacks as object
  getSetbacks() {
    return {
      front: Number(this.setbackFront),
      rear: Number(this.setbackRear),
      side1: Number(this.setbackSide1),
      side2: Number(this.setbackSide2),
    };
  }
}
