import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { City } from './city.entity';

export type ComplianceRuleType =
  | 'fire_noc'
  | 'rainwater_harvesting'
  | 'solar_panel'
  | 'airport_noc'
  | 'parking';

@Entity('compliance_rules')
export class ComplianceRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'city_id', length: 50 })
  cityId: string;

  @ManyToOne(() => City, (city) => city.complianceRules)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'rule_type', length: 50 })
  ruleType: ComplianceRuleType;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({
    name: 'threshold_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  thresholdValue: number;

  @Column({ name: 'threshold_type', length: 50, nullable: true })
  thresholdType: 'height' | 'plot_size' | 'distance' | 'floors';

  @Column({ type: 'text', nullable: true })
  notes: string;
}
