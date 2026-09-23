import bcrypt from 'bcrypt';
import { prismaClient } from '../src/app/utils/prisma.js';

export async function seedDatabase() {
  console.log('🌱 Starting GridPulse database seeding via Prisma 7...');

  try {
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const techPassword = await bcrypt.hash('Tech@123456', 10);
    const customerPassword = await bcrypt.hash('Customer@123456', 10);

    // 1. Seed Distribution Zones
    console.log('📦 Seeding Distribution Zones...');
    const zoneNorth = await prismaClient.distributionZone.upsert({
      where: { code: 'ZONE-NORTH-01' },
      update: {},
      create: {
        id: 'zone-01-north',
        name: 'North Metro Distribution Grid',
        code: 'ZONE-NORTH-01',
        region: 'North Sector',
        maxCapacityMW: 650,
        currentLoadMW: 480,
      },
    });

    const zoneCentral = await prismaClient.distributionZone.upsert({
      where: { code: 'ZONE-CENTRAL-02' },
      update: {},
      create: {
        id: 'zone-02-central',
        name: 'Central Industrial & Commercial Zone',
        code: 'ZONE-CENTRAL-02',
        region: 'Central Sector',
        maxCapacityMW: 850,
        currentLoadMW: 720,
      },
    });

    // 2. Seed Substations
    console.log('⚡ Seeding Substations...');
    const subNorth = await prismaClient.substation.upsert({
      where: { code: 'SUB-DHN-01' },
      update: {},
      create: {
        id: 'sub-01',
        name: 'Dhanmondi 132/33kV Primary Substation',
        code: 'SUB-DHN-01',
        zoneId: zoneNorth.id,
        capacityMVA: 120,
        status: 'OPERATIONAL',
      },
    });

    const subCentral = await prismaClient.substation.upsert({
      where: { code: 'SUB-GLS-02' },
      update: {},
      create: {
        id: 'sub-02',
        name: 'Gulshan 230/33kV Grid Hub',
        code: 'SUB-GLS-02',
        zoneId: zoneCentral.id,
        capacityMVA: 200,
        status: 'OPERATIONAL',
      },
    });

    // 3. Seed Feeders
    console.log('🔌 Seeding Feeders...');
    const fdr1 = await prismaClient.feeder.upsert({
      where: { code: 'FDR-DHN-RES-01' },
      update: {},
      create: {
        id: 'fdr-01',
        name: 'Dhanmondi Residential Feeder-A',
        code: 'FDR-DHN-RES-01',
        substationId: subNorth.id,
        currentDemandMW: 14.2,
        maxLimitMW: 18.0,
        status: 'ACTIVE',
      },
    });

    const fdr2 = await prismaClient.feeder.upsert({
      where: { code: 'FDR-HOSP-EXP-02' },
      update: {},
      create: {
        id: 'fdr-02',
        name: 'Green Life Hospital Express Line',
        code: 'FDR-HOSP-EXP-02',
        substationId: subNorth.id,
        currentDemandMW: 8.5,
        maxLimitMW: 15.0,
        status: 'ACTIVE',
      },
    });

    const fdr3 = await prismaClient.feeder.upsert({
      where: { code: 'FDR-GLS-COM-03' },
      update: {},
      create: {
        id: 'fdr-03',
        name: 'Gulshan Commercial Towers Feeder',
        code: 'FDR-GLS-COM-03',
        substationId: subCentral.id,
        currentDemandMW: 26.8,
        maxLimitMW: 30.0,
        status: 'LOAD_SHEDDING',
      },
    });

    // 4. Seed Areas
    console.log('🏘️ Seeding Residential & Critical Areas...');
    const area1 = await prismaClient.area.upsert({
      where: { id: 'area-01' },
      update: {},
      create: {
        id: 'area-01',
        name: 'Dhanmondi R/A Sector 4 & 7',
        postalCode: '1205',
        feederId: fdr1.id,
        population: 45000,
        priority: 'NORMAL',
      },
    });

    await prismaClient.area.upsert({
      where: { id: 'area-02' },
      update: {},
      create: {
        id: 'area-02',
        name: 'Green Life Medical Enclave',
        postalCode: '1206',
        feederId: fdr2.id,
        population: 12000,
        priority: 'CRITICAL_HOSPITAL',
      },
    });

    await prismaClient.area.upsert({
      where: { id: 'area-03' },
      update: {},
      create: {
        id: 'area-03',
        name: 'Gulshan Avenue Diplomatic Zone',
        postalCode: '1212',
        feederId: fdr3.id,
        population: 68000,
        priority: 'HIGH',
      },
    });

    // 5. Seed Users
    console.log('👤 Seeding System Users (Admin, Technician, Customer)...');
    await prismaClient.user.upsert({
      where: { email: 'admin@gridpulse.gov' },
      update: {},
      create: {
        id: 'user-admin-01',
        name: 'Chief Grid Controller Eng. Farhan',
        email: 'admin@gridpulse.gov',
        password: adminPassword,
        role: 'ADMIN',
        phone: '+8801711000001',
        isVerified: true,
      },
    });

    await prismaClient.user.upsert({
      where: { email: 'tech.rahim@gridpulse.gov' },
      update: {},
      create: {
        id: 'user-tech-01',
        name: 'Senior Field Technician Rahim Uddin',
        email: 'tech.rahim@gridpulse.gov',
        password: techPassword,
        role: 'TECHNICIAN',
        phone: '+8801811000002',
        isVerified: true,
      },
    });

    await prismaClient.user.upsert({
      where: { email: 'customer.hasan@gmail.com' },
      update: {},
      create: {
        id: 'user-cust-01',
        name: 'Tariq Hasan (Residential Consumer)',
        email: 'customer.hasan@gmail.com',
        password: customerPassword,
        role: 'CUSTOMER',
        phone: '+8801911000003',
        areaId: area1.id,
        isVerified: true,
      },
    });

    console.log('✅ GridPulse database seeded successfully!');
  } catch (error) {
    console.warn('Notice: Seeding to PostgreSQL instance skipped or database offline; in-memory store remains active:', (error as Error).message);
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(0);
    });
}
