import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlotSizeRule } from './plot-size-rule.entity';
import { BasementRule } from './basement-rule.entity';
import { StiltRule } from './stilt-rule.entity';
import { ComplianceRule } from './compliance-rule.entity';
import { RoadWidthRule } from './road-width-rule.entity';

@Entity('cities')
export class City {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'full_name', length: 200, nullable: true })
  fullName: string;

  @Column({ length: 200, nullable: true })
  authority: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ name: 'far_unit', length: 20, default: 'ratio' })
  farUnit: 'percentage' | 'ratio';

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string;

  @Column({ name: 'last_bylaw_update', type: 'timestamp', nullable: true })
  lastBylawUpdate: Date;

  @Column({ type: 'text', array: true, name: 'general_notes', default: '{}' })
  generalNotes: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => PlotSizeRule, (rule) => rule.city)
  plotSizeRules: PlotSizeRule[];

  @OneToMany(() => BasementRule, (rule) => rule.city)
  basementRules: BasementRule[];

  @OneToMany(() => StiltRule, (rule) => rule.city)
  stiltRules: StiltRule[];

  @OneToMany(() => ComplianceRule, (rule) => rule.city)
  complianceRules: ComplianceRule[];

  @OneToMany(() => RoadWidthRule, (rule) => rule.city)
  roadWidthRules: RoadWidthRule[];
}
