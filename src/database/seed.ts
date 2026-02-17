/**
 * Database Seed Script for FAR Calculator
 * Seeds all city bylaws for Delhi NCR region
 *
 * Run with: npm run db:seed
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Import entities
import { City } from '../far/entities/city.entity';
import { PlotSizeRule } from '../far/entities/plot-size-rule.entity';
import { BasementRule } from '../far/entities/basement-rule.entity';
import { StiltRule } from '../far/entities/stilt-rule.entity';
import { ComplianceRule } from '../far/entities/compliance-rule.entity';
import { RoadWidthRule } from '../far/entities/road-width-rule.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'zuildup_far',
  entities: [
    City,
    PlotSizeRule,
    BasementRule,
    StiltRule,
    ComplianceRule,
    RoadWidthRule,
  ],
  synchronize: true,
  logging: true,
});

// ============================================================================
// SEED DATA
// ============================================================================

const citiesData = [
  {
    id: 'delhi',
    name: 'Delhi',
    fullName: 'New Delhi (MPD-2021)',
    authority: 'DDA / MCD (as per MPD-2021)',
    state: 'Delhi NCT',
    farUnit: 'percentage' as const,
    sourceUrl: 'https://dda.org.in/planning/mpd-2021.htm',
    generalNotes: [
      'FAR calculations based on Master Plan for Delhi 2021',
      'Stilt parking is not counted in FAR if kept open',
      'Basement not counted in FAR if used for parking/storage only',
      'Height measured from ground level to top of building',
      'Lift machine room and water tank (mumty) allowed above max height',
    ],
  },
  {
    id: 'noida',
    name: 'Noida',
    fullName: 'Noida (Greater Noida)',
    authority: 'Noida Authority / GNIDA',
    state: 'Uttar Pradesh',
    farUnit: 'ratio' as const,
    sourceUrl: 'https://noidaauthorityonline.in/building-bylaws',
    generalNotes: [
      'FAR as per Noida Building Regulations 2020',
      'Additional FAR available for affordable housing',
      'Green building certification can get FAR bonus',
      'Basement floor not counted in FAR',
    ],
  },
  {
    id: 'gurugram',
    name: 'Gurugram',
    fullName: 'Gurugram (Gurgaon)',
    authority: 'HSVP / DTCP Haryana',
    state: 'Haryana',
    farUnit: 'ratio' as const,
    sourceUrl: 'https://www.prithu.in/post/haryana-building-bye-laws-2021',
    generalNotes: [
      'FAR as per Haryana Building Bye-Laws 2021',
      'Stilt parking mandatory for 3+ floors with separate dwelling units',
      'Basement not counted in FAR if used for parking/storage',
      'Max building height 15m including stilt',
      'Balcony projection up to 1.8m in front/rear setback (max half of setback)',
    ],
  },
  {
    id: 'ghaziabad',
    name: 'Ghaziabad',
    fullName: 'Ghaziabad',
    authority: 'GDA (Ghaziabad Development Authority)',
    state: 'Uttar Pradesh',
    farUnit: 'ratio' as const,
    sourceUrl: 'https://gda.gov.in/building-bye-laws',
    generalNotes: [
      'FAR as per GDA Building Bye-laws 2018',
      'Stilt parking exempted from FAR',
      'Basement allowed for parking/services only',
    ],
  },
  {
    id: 'faridabad',
    name: 'Faridabad',
    fullName: 'Faridabad',
    authority: 'HSVP / MCF',
    state: 'Haryana',
    farUnit: 'ratio' as const,
    sourceUrl: 'https://www.prithu.in/post/haryana-building-bye-laws-2021',
    generalNotes: [
      'FAR as per Haryana Building Bye-Laws 2021',
      'Similar to Gurugram regulations',
      'Basement not counted in FAR if used for parking/storage',
    ],
  },
];

// DELHI Plot Size Rules (MPD-2021) - FAR in percentage (350 = 3.5)
const delhiPlotRules = [
  {
    minSizeSqm: 0,
    maxSizeSqm: 32,
    far: 350,
    groundCoverage: 90,
    maxDwellingUnits: 3,
    setbackFront: 0,
    setbackRear: 0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Row housing - Plots below 32 sqm',
  },
  {
    minSizeSqm: 32,
    maxSizeSqm: 50,
    far: 350,
    groundCoverage: 90,
    maxDwellingUnits: 3,
    setbackFront: 0,
    setbackRear: 0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Row housing - 32-50 sqm plots',
  },
  {
    minSizeSqm: 50,
    maxSizeSqm: 100,
    far: 350,
    groundCoverage: 90,
    maxDwellingUnits: 4,
    setbackFront: 0,
    setbackRear: 0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Row housing type - Stilt + 4 floors (G+3)',
  },
  {
    minSizeSqm: 100,
    maxSizeSqm: 250,
    far: 300,
    groundCoverage: 75,
    maxDwellingUnits: 4,
    setbackFront: 3,
    setbackRear: 0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Builder floor type - Front setback 3m required',
  },
  {
    minSizeSqm: 250,
    maxSizeSqm: 500,
    far: 225,
    groundCoverage: 75,
    maxDwellingUnits: 6,
    setbackFront: 3,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 0,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Bungalow type - 3 sided setbacks',
  },
  {
    minSizeSqm: 500,
    maxSizeSqm: 750,
    far: 200,
    groundCoverage: 50,
    maxDwellingUnits: 6,
    setbackFront: 6,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 3,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Large plot - All sided setbacks',
  },
  {
    minSizeSqm: 750,
    maxSizeSqm: 1000,
    far: 200,
    groundCoverage: 50,
    maxDwellingUnits: 9,
    setbackFront: 6,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 3,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Estate plots - 750-1000 sqm',
  },
  {
    minSizeSqm: 1000,
    maxSizeSqm: null,
    far: 200,
    groundCoverage: 50,
    maxDwellingUnits: 12,
    setbackFront: 9,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 3,
    maxHeight: 17.5,
    maxFloors: 4,
    notes: 'Large estate - Above 1000 sqm',
  },
];

// Gurugram Road Width FAR - Removed (Haryana Bye-Laws 2021 use plot-size based FAR)
const gurugramRoadWidthRules: { minRoadWidth: number; maxRoadWidth: number | null; far: number; notes: string }[] = [];

// NOIDA Plot Size Rules - FAR as ratio
const noidaPlotRules = [
  {
    minSizeSqm: 0,
    maxSizeSqm: 112,
    far: 1.8,
    groundCoverage: 65,
    maxDwellingUnits: 3,
    setbackFront: 3,
    setbackRear: 2,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: 'Small plots up to 120 sqyd',
  },
  {
    minSizeSqm: 112,
    maxSizeSqm: 200,
    far: 1.8,
    groundCoverage: 65,
    maxDwellingUnits: 4,
    setbackFront: 3,
    setbackRear: 2,
    setbackSide1: 2,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '120-240 sqyd plots',
  },
  {
    minSizeSqm: 200,
    maxSizeSqm: 400,
    far: 1.5,
    groundCoverage: 55,
    maxDwellingUnits: 4,
    setbackFront: 4.5,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '240-480 sqyd plots',
  },
  {
    minSizeSqm: 400,
    maxSizeSqm: null,
    far: 1.2,
    groundCoverage: 45,
    maxDwellingUnits: 6,
    setbackFront: 6,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 3,
    maxHeight: 15,
    maxFloors: 4,
    notes: 'Large plots above 480 sqyd',
  },
];

// GURUGRAM Plot Size Rules (Haryana Building Bye-Laws 2021)
const gurugramPlotRules = [
  {
    minSizeSqm: 0,
    maxSizeSqm: 75,
    far: 1.65,
    groundCoverage: 85,
    maxDwellingUnits: 3,
    setbackFront: 1.5,
    setbackRear: 1.0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: 'Small plots up to 75 sqm',
  },
  {
    minSizeSqm: 75,
    maxSizeSqm: 100,
    far: 1.65,
    groundCoverage: 85,
    maxDwellingUnits: 3,
    setbackFront: 1.5,
    setbackRear: 1.0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '75-100 sqm plots',
  },
  {
    minSizeSqm: 100,
    maxSizeSqm: 150,
    far: 1.45,
    groundCoverage: 66,
    maxDwellingUnits: 4,
    setbackFront: 1.5,
    setbackRear: 1.0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '100-150 sqm plots',
  },
  {
    minSizeSqm: 150,
    maxSizeSqm: 225,
    far: 1.45,
    groundCoverage: 66,
    maxDwellingUnits: 4,
    setbackFront: 2.5,
    setbackRear: 2.0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '150-225 sqm plots',
  },
  {
    minSizeSqm: 225,
    maxSizeSqm: 350,
    far: 1.25,
    groundCoverage: 60,
    maxDwellingUnits: 4,
    setbackFront: 3.0,
    setbackRear: 3.0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '225-350 sqm plots',
  },
  {
    minSizeSqm: 350,
    maxSizeSqm: 500,
    far: 1.20,
    groundCoverage: 60,
    maxDwellingUnits: 6,
    setbackFront: 3.0,
    setbackRear: 3.0,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '350-500 sqm plots',
  },
  {
    minSizeSqm: 500,
    maxSizeSqm: null,
    far: 1.00,
    groundCoverage: 50,
    maxDwellingUnits: 6,
    setbackFront: 4.5,
    setbackRear: 4.0,
    setbackSide1: 3.0,
    setbackSide2: 3.0,
    maxHeight: 15,
    maxFloors: 4,
    notes: 'Large plots above 500 sqm',
  },
];

// GHAZIABAD Plot Size Rules
const ghaziabadPlotRules = [
  {
    minSizeSqm: 0,
    maxSizeSqm: 100,
    far: 2.0,
    groundCoverage: 70,
    maxDwellingUnits: 3,
    setbackFront: 3,
    setbackRear: 2,
    setbackSide1: 0,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: 'Small plots',
  },
  {
    minSizeSqm: 100,
    maxSizeSqm: 200,
    far: 1.8,
    groundCoverage: 65,
    maxDwellingUnits: 4,
    setbackFront: 3,
    setbackRear: 2,
    setbackSide1: 2,
    setbackSide2: 0,
    maxHeight: 15,
    maxFloors: 4,
    notes: '100-200 sqm plots',
  },
  {
    minSizeSqm: 200,
    maxSizeSqm: 400,
    far: 1.5,
    groundCoverage: 55,
    maxDwellingUnits: 4,
    setbackFront: 4.5,
    setbackRear: 3,
    setbackSide1: 2,
    setbackSide2: 2,
    maxHeight: 15,
    maxFloors: 4,
    notes: '200-400 sqm plots',
  },
  {
    minSizeSqm: 400,
    maxSizeSqm: null,
    far: 1.25,
    groundCoverage: 45,
    maxDwellingUnits: 6,
    setbackFront: 6,
    setbackRear: 3,
    setbackSide1: 3,
    setbackSide2: 3,
    maxHeight: 15,
    maxFloors: 4,
    notes: 'Large plots',
  },
];

// FARIDABAD Plot Size Rules (similar to Gurugram)
const faridabadPlotRules = gurugramPlotRules.map((rule) => ({
  ...rule,
  notes: rule.notes + ' (Faridabad)',
}));

// Basement Rules (common structure) - Single basement only for all cities
const basementRules = {
  delhi: {
    allowed: true,
    countedInFar: false,
    maxLevels: 1,
    minHeight: 2.4,
    maxHeight: 4.0,
    allowedUses: ['parking', 'storage', 'services'],
    notes: 'Single basement allowed, not counted in FAR if used for permitted purposes',
  },
  noida: {
    allowed: true,
    countedInFar: false,
    maxLevels: 1,
    minHeight: 2.4,
    maxHeight: 3.5,
    allowedUses: ['parking', 'storage'],
    notes: 'Single basement allowed',
  },
  gurugram: {
    allowed: true,
    countedInFar: false,
    maxLevels: 1,
    minHeight: 2.4,
    maxHeight: 4.75,
    allowedUses: ['parking', 'storage'],
    notes: 'Single basement allowed, not counted in FAR if used for parking/storage',
  },
  ghaziabad: {
    allowed: true,
    countedInFar: false,
    maxLevels: 1,
    minHeight: 2.4,
    maxHeight: 3.5,
    allowedUses: ['parking', 'storage'],
    notes: 'Single basement allowed',
  },
  faridabad: {
    allowed: true,
    countedInFar: false,
    maxLevels: 1,
    minHeight: 2.4,
    maxHeight: 4.75,
    allowedUses: ['parking', 'storage'],
    notes: 'Single basement allowed, same as Gurugram regulations',
  },
};

// Stilt Rules
const stiltRules = {
  delhi: {
    allowed: true,
    countedInFar: false,
    minHeight: 2.4,
    mandatory: true,
    mandatoryAboveFloors: 3,
    notes: 'Stilt mandatory for G+3 and above',
  },
  noida: {
    allowed: true,
    countedInFar: false,
    minHeight: 2.4,
    mandatory: false,
    notes: 'Stilt optional but recommended',
  },
  gurugram: {
    allowed: true,
    countedInFar: false,
    minHeight: 2.45,
    mandatory: true,
    mandatoryAboveFloors: 3,
    notes: 'Stilt mandatory for buildings with 3+ floors (separate dwelling units)',
  },
  ghaziabad: {
    allowed: true,
    countedInFar: false,
    minHeight: 2.4,
    mandatory: false,
    notes: 'Stilt optional',
  },
  faridabad: {
    allowed: true,
    countedInFar: false,
    minHeight: 2.4,
    mandatory: false,
    notes: 'Stilt optional',
  },
};

// Compliance Rules
const complianceRules: Array<{
  ruleType: 'fire_noc' | 'rainwater_harvesting' | 'solar_panel' | 'airport_noc' | 'parking';
  required: boolean;
  thresholdValue: number;
  thresholdType: 'height' | 'plot_size' | 'distance' | 'floors';
  notes: string;
}> = [
  {
    ruleType: 'fire_noc',
    required: true,
    thresholdValue: 15,
    thresholdType: 'height',
    notes: 'Required for buildings above 15m height',
  },
  {
    ruleType: 'rainwater_harvesting',
    required: true,
    thresholdValue: 100,
    thresholdType: 'plot_size',
    notes: 'Mandatory for plots above 100 sqm',
  },
  {
    ruleType: 'solar_panel',
    required: true,
    thresholdValue: 500,
    thresholdType: 'plot_size',
    notes: 'Mandatory for plots above 500 sqm',
  },
  {
    ruleType: 'airport_noc',
    required: true,
    thresholdValue: 30,
    thresholdType: 'height',
    notes: 'Required for buildings above 30m near airports',
  },
  {
    ruleType: 'parking',
    required: true,
    thresholdValue: 1,
    thresholdType: 'floors',
    notes: 'Minimum 1 ECS per dwelling unit',
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await AppDataSource.query('TRUNCATE TABLE compliance_rules CASCADE');
    await AppDataSource.query('TRUNCATE TABLE road_width_rules CASCADE');
    await AppDataSource.query('TRUNCATE TABLE stilt_rules CASCADE');
    await AppDataSource.query('TRUNCATE TABLE basement_rules CASCADE');
    await AppDataSource.query('TRUNCATE TABLE plot_size_rules CASCADE');
    await AppDataSource.query('TRUNCATE TABLE cities CASCADE');
    console.log('✅ Existing data cleared\n');

    // Insert cities
    console.log('📍 Inserting cities...');
    const cityRepo = AppDataSource.getRepository(City);
    for (const cityData of citiesData) {
      await cityRepo.save(cityData);
      console.log(`   ✓ ${cityData.name}`);
    }
    console.log('');

    // Insert plot size rules
    console.log('📐 Inserting plot size rules...');
    const plotRuleRepo = AppDataSource.getRepository(PlotSizeRule);

    const cityPlotRules: Record<string, typeof delhiPlotRules> = {
      delhi: delhiPlotRules,
      noida: noidaPlotRules,
      gurugram: gurugramPlotRules,
      ghaziabad: ghaziabadPlotRules,
      faridabad: faridabadPlotRules,
    };

    for (const [cityId, rules] of Object.entries(cityPlotRules)) {
      for (const rule of rules) {
        await plotRuleRepo.save({ cityId, ...rule });
      }
      console.log(`   ✓ ${cityId}: ${rules.length} rules`);
    }
    console.log('');

    // Insert road width rules (Gurugram only)
    console.log('🛣️  Inserting road width rules...');
    const roadWidthRepo = AppDataSource.getRepository(RoadWidthRule);
    for (const rule of gurugramRoadWidthRules) {
      await roadWidthRepo.save({ cityId: 'gurugram', ...rule });
    }
    console.log(`   ✓ gurugram: ${gurugramRoadWidthRules.length} rules\n`);

    // Insert basement rules
    console.log('🏠 Inserting basement rules...');
    const basementRepo = AppDataSource.getRepository(BasementRule);
    for (const [cityId, rule] of Object.entries(basementRules)) {
      await basementRepo.save({ cityId, ...rule });
      console.log(`   ✓ ${cityId}`);
    }
    console.log('');

    // Insert stilt rules
    console.log('🚗 Inserting stilt rules...');
    const stiltRepo = AppDataSource.getRepository(StiltRule);
    for (const [cityId, rule] of Object.entries(stiltRules)) {
      await stiltRepo.save({ cityId, ...rule });
      console.log(`   ✓ ${cityId}`);
    }
    console.log('');

    // Insert compliance rules
    console.log('✅ Inserting compliance rules...');
    const complianceRepo = AppDataSource.getRepository(ComplianceRule);
    for (const cityData of citiesData) {
      for (const rule of complianceRules) {
        await complianceRepo.save({ cityId: cityData.id, ...rule });
      }
      console.log(`   ✓ ${cityData.id}: ${complianceRules.length} rules`);
    }
    console.log('');

    console.log('🎉 Database seeded successfully!\n');

    // Print summary
    console.log('📊 Summary:');
    console.log(`   Cities: ${citiesData.length}`);
    console.log(
      `   Plot Size Rules: ${Object.values(cityPlotRules).reduce((a, b) => a + b.length, 0)}`,
    );
    console.log(`   Road Width Rules: ${gurugramRoadWidthRules.length}`);
    console.log(`   Basement Rules: ${Object.keys(basementRules).length}`);
    console.log(`   Stilt Rules: ${Object.keys(stiltRules).length}`);
    console.log(
      `   Compliance Rules: ${citiesData.length * complianceRules.length}`,
    );
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
