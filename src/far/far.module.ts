import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarController } from './far.controller';
import { FarService } from './far.service';
import {
  City,
  PlotSizeRule,
  BasementRule,
  StiltRule,
  ComplianceRule,
  RoadWidthRule,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      City,
      PlotSizeRule,
      BasementRule,
      StiltRule,
      ComplianceRule,
      RoadWidthRule,
    ]),
  ],
  controllers: [FarController],
  providers: [FarService],
  exports: [FarService],
})
export class FarModule {}
