import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Pool } from "pg";

// ==========================================
// Prisma 7 PostgreSQL Driver Adapter Setup
// ==========================================
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/gridpulse_db?schema=public";

export const pgPool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 3000,
});

// Prisma 7 native PostgreSQL adapter
export const prismaPgAdapter = new PrismaPg(pgPool);
export const prismaClient = new PrismaClient({ adapter: prismaPgAdapter });

// GridPulse In-Memory Prisma Compatible Database Store
// Designed to match PrismaClient interface and provide instant zero-setup data persistence
export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
  isVerified: boolean;
  areaId?: string | null;
  avatarUrl?: string | null;
  googleId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IDistributionZone {
  id: string;
  name: string;
  code: string;
  region: string;
  maxCapacityMW: number;
  currentLoadMW: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubstation {
  id: string;
  name: string;
  code: string;
  zoneId: string;
  capacityMVA: number;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeder {
  id: string;
  name: string;
  code: string;
  substationId: string;
  currentDemandMW: number;
  maxLimitMW: number;
  status: "ACTIVE" | "LOAD_SHEDDING" | "TRIPPED" | "MAINTENANCE";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IArea {
  id: string;
  name: string;
  postalCode: string;
  feederId: string;
  population: number;
  priority: "NORMAL" | "HIGH" | "CRITICAL_HOSPITAL";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoadSheddingSchedule {
  id: string;
  title: string;
  feederId: string;
  startTime: Date;
  endTime: Date;
  targetDeficitMW: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  recurringDays: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOutageReport {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  feederId: string;
  areaId: string;
  reportedById: string;
  assignedTechnicianId?: string | null;
  outageType:
    | "UNPLANNED"
    | "FEEDER_TRIP"
    | "TRANSFORMER_FAILURE"
    | "CABLE_FAULT"
    | "SCHEDULED_SHED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  status:
    | "REPORTED"
    | "VERIFIED"
    | "TECHNICIAN_ASSIGNED"
    | "EN_ROUTE"
    | "REPAIR_IN_PROGRESS"
    | "RESTORED"
    | "CANCELLED";
  photoUrl?: string | null;
  estimatedRestoration?: Date | null;
  restoredAt?: Date | null;
  resolutionNotes?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOutageTimeline {
  id: string;
  outageId: string;
  status: IOutageReport["status"];
  notes?: string | null;
  updatedById: string;
  createdAt: Date;
}

export interface IPayment {
  id: string;
  transactionId: string;
  stripeSessionId?: string | null;
  userId: string;
  amount: number;
  currency: string;
  purpose: "BILL_PAYMENT" | "PRIORITY_RECONNECTION" | "MAINTENANCE_FEE";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}

class PrismaMemoryStore {
  users: IUser[] = [];
  distributionZones: IDistributionZone[] = [];
  substations: ISubstation[] = [];
  feeders: IFeeder[] = [];
  areas: IArea[] = [];
  loadSheddingSchedules: ILoadSheddingSchedule[] = [];
  outageReports: IOutageReport[] = [];
  outageTimelines: IOutageTimeline[] = [];
  payments: IPayment[] = [];
  auditLogs: IAuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const adminHashed = bcrypt.hashSync("Admin@123456", salt);
    const techHashed = bcrypt.hashSync("Tech@123456", salt);
    const custHashed = bcrypt.hashSync("Customer@123456", salt);

    // Distribution Zones
    const zone1: IDistributionZone = {
      id: "zone-01-north",
      name: "North Metro Distribution Grid",
      code: "ZONE-NORTH-01",
      region: "North Sector",
      maxCapacityMW: 650,
      currentLoadMW: 480,
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };

    const zone2: IDistributionZone = {
      id: "zone-02-central",
      name: "Central Industrial & Commercial Zone",
      code: "ZONE-CENTRAL-02",
      region: "Central Sector",
      maxCapacityMW: 850,
      currentLoadMW: 720,
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };
    this.distributionZones.push(zone1, zone2);

    // Substations
    const sub1: ISubstation = {
      id: "sub-01",
      name: "Dhanmondi 132/33kV Primary Substation",
      code: "SUB-DHN-01",
      zoneId: zone1.id,
      capacityMVA: 120,
      status: "OPERATIONAL",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };

    const sub2: ISubstation = {
      id: "sub-02",
      name: "Gulshan 230/33kV Grid Hub",
      code: "SUB-GLS-02",
      zoneId: zone2.id,
      capacityMVA: 200,
      status: "OPERATIONAL",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };
    this.substations.push(sub1, sub2);

    // Feeders
    const f1: IFeeder = {
      id: "fdr-01",
      name: "Dhanmondi Residential Feeder-A",
      code: "FDR-DHN-RES-01",
      substationId: sub1.id,
      currentDemandMW: 14.2,
      maxLimitMW: 18.0,
      status: "ACTIVE",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };

    const f2: IFeeder = {
      id: "fdr-02",
      name: "Green Life Hospital Express Line",
      code: "FDR-HOSP-EXP-02",
      substationId: sub1.id,
      currentDemandMW: 8.5,
      maxLimitMW: 15.0,
      status: "ACTIVE",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };

    const f3: IFeeder = {
      id: "fdr-03",
      name: "Gulshan Commercial Towers Feeder",
      code: "FDR-GLS-COM-03",
      substationId: sub2.id,
      currentDemandMW: 26.8,
      maxLimitMW: 30.0,
      status: "LOAD_SHEDDING",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };
    this.feeders.push(f1, f2, f3);

    // Areas
    const area1: IArea = {
      id: "area-01",
      name: "Dhanmondi Road 27 & Satmasjid",
      postalCode: "1209",
      feederId: f1.id,
      population: 45000,
      priority: "NORMAL",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };

    const area2: IArea = {
      id: "area-02",
      name: "Central Hospital Complex & Emergency Care",
      postalCode: "1205",
      feederId: f2.id,
      population: 18000,
      priority: "CRITICAL_HOSPITAL",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };

    const area3: IArea = {
      id: "area-03",
      name: "Gulshan Avenue Commercial Square",
      postalCode: "1212",
      feederId: f3.id,
      population: 60000,
      priority: "HIGH",
      isDeleted: false,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    };
    this.areas.push(area1, area2, area3);

    // Users
    const adminUser: IUser = {
      id: "user-admin-01",
      email: "admin@gridpulse.gov",
      password: adminHashed,
      name: "Chief Grid Controller Eng. Farhan",
      phone: "+8801711002233",
      role: "ADMIN",
      isVerified: true,
      areaId: area1.id,
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: null,
    };

    const techUser: IUser = {
      id: "user-tech-01",
      email: "tech.rahim@gridpulse.gov",
      password: techHashed,
      name: "Senior Grid Technician Rahim Khan",
      phone: "+8801822334455",
      role: "TECHNICIAN",
      isVerified: true,
      areaId: area1.id,
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      createdAt: new Date("2026-01-05T00:00:00Z"),
      updatedAt: new Date("2026-01-05T00:00:00Z"),
      deletedAt: null,
    };

    const custUser: IUser = {
      id: "user-cust-01",
      email: "customer.hasan@gmail.com",
      password: custHashed,
      name: "Tariq Hasan",
      phone: "+8801933445566",
      role: "CUSTOMER",
      isVerified: true,
      areaId: area1.id,
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      createdAt: new Date("2026-01-15T00:00:00Z"),
      updatedAt: new Date("2026-01-15T00:00:00Z"),
      deletedAt: null,
    };
    this.users.push(adminUser, techUser, custUser);

    // Schedules
    const sched1: ILoadSheddingSchedule = {
      id: "sched-01",
      title: "Peak Evening Load Reduction Slot A",
      feederId: f3.id,
      startTime: new Date(Date.now() + 3600 * 1000 * 2),
      endTime: new Date(Date.now() + 3600 * 1000 * 3.5),
      targetDeficitMW: 7.5,
      status: "SCHEDULED",
      recurringDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.loadSheddingSchedules.push(sched1);

    // Outage Reports
    const outage1: IOutageReport = {
      id: "outage-01",
      ticketNumber: "TKT-2026-0891",
      title: "Distribution Transformer Oil Leak & Feeder Trip",
      description:
        "Pole transformer sparking near Satmasjid road corner. Feeder tripped automatically to prevent fire outbreak.",
      feederId: f1.id,
      areaId: area1.id,
      reportedById: custUser.id,
      assignedTechnicianId: techUser.id,
      outageType: "TRANSFORMER_FAILURE",
      severity: "HIGH",
      status: "REPAIR_IN_PROGRESS",
      photoUrl:
        "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800",
      estimatedRestoration: new Date(Date.now() + 3600 * 1000 * 1.5),
      restoredAt: null,
      resolutionNotes:
        "Replacing secondary bushing seal and insulating oil replenishment.",
      isDeleted: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 0.5),
    };

    const outage2: IOutageReport = {
      id: "outage-02",
      ticketNumber: "TKT-2026-0892",
      title: "Underground Cable Joint Breakdown",
      description:
        "Loss of phase B voltage detected on Gulshan secondary ring line.",
      feederId: f3.id,
      areaId: area3.id,
      reportedById: adminUser.id,
      assignedTechnicianId: null,
      outageType: "CABLE_FAULT",
      severity: "MEDIUM",
      status: "REPORTED",
      photoUrl:
        "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800",
      estimatedRestoration: new Date(Date.now() + 3600 * 1000 * 4),
      restoredAt: null,
      resolutionNotes: null,
      isDeleted: false,
      createdAt: new Date(Date.now() - 1800 * 1000),
      updatedAt: new Date(Date.now() - 1800 * 1000),
    };
    this.outageReports.push(outage1, outage2);

    // Outage Timelines
    this.outageTimelines.push(
      {
        id: "otl-01",
        outageId: outage1.id,
        status: "REPORTED",
        notes: "Citizen submitted report with pole location photo",
        updatedById: custUser.id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
      {
        id: "otl-02",
        outageId: outage1.id,
        status: "TECHNICIAN_ASSIGNED",
        notes:
          "Dispatched Senior Technician Rahim Khan with transformer toolkit van #04",
        updatedById: adminUser.id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5),
      },
      {
        id: "otl-03",
        outageId: outage1.id,
        status: "REPAIR_IN_PROGRESS",
        notes:
          "Field crew arrived at Satmasjid site. Isolating upstream switch gear.",
        updatedById: techUser.id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 0.5),
      },
    );

    // Payments
    this.payments.push({
      id: "pay-01",
      transactionId: "TXN-GP-98402",
      stripeSessionId: "cs_test_mock_98402",
      userId: custUser.id,
      amount: 45.5,
      currency: "usd",
      purpose: "BILL_PAYMENT",
      status: "COMPLETED",
      metadata: { invoiceNumber: "INV-FEB-2026-441", feeder: f1.name },
      createdAt: new Date(Date.now() - 86400 * 1000 * 2),
      updatedAt: new Date(Date.now() - 86400 * 1000 * 2),
    });

    // Audit logs
    this.auditLogs.push(
      {
        id: "audit-01",
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "SCHEDULE_CREATED",
        entity: "LoadSheddingSchedule",
        entityId: sched1.id,
        details: { feeder: f3.name, deficitMW: 7.5 },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 3600 * 1000 * 5),
      },
      {
        id: "audit-02",
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "TECHNICIAN_DISPATCHED",
        entity: "OutageReport",
        entityId: outage1.id,
        details: { technicianId: techUser.id, ticket: outage1.ticketNumber },
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5),
      },
    );
  }
}

const store = new PrismaMemoryStore();

const memoryPrisma = {
  user: {
    findUnique: async ({
      where,
      select,
    }: {
      where: { id?: string; email?: string; googleId?: string };
      select?: Record<string, boolean>;
    }) => {
      const user = store.users.find((u) => {
        if (where.id && u.id === where.id) return true;
        if (where.email && u.email.toLowerCase() === where.email.toLowerCase())
          return true;
        if (where.googleId && u.googleId === where.googleId) return true;
        return false;
      });
      if (!user || user.deletedAt) return null;
      if (select) {
        const result: Record<string, unknown> = {};
        for (const k of Object.keys(select)) {
          if (select[k]) result[k] = (user as any)[k];
        }
        return result as any;
      }
      return { ...user };
    },
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const u = store.users.find((user) => {
        if (user.deletedAt) return false;
        return Object.keys(where).every(
          (k) => (user as any)[k] === (where as any)[k],
        );
      });
      return u ? { ...u } : null;
    },
    findMany: async ({
      where,
      select,
      skip = 0,
      take = 50,
      orderBy,
    }: {
      where?: Record<string, any>;
      select?: Record<string, boolean>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, "asc" | "desc">;
    }) => {
      let list = store.users.filter((u) => !u.deletedAt);
      if (where) {
        if (where.role) list = list.filter((u) => u.role === where.role);
        if (where.email) list = list.filter((u) => u.email === where.email);
        if (
          where.name &&
          typeof where.name === "object" &&
          where.name.contains
        ) {
          const q = where.name.contains.toLowerCase();
          list = list.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q),
          );
        }
      }
      if (orderBy?.createdAt === "desc") {
        list = [...list].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      }
      const pageList = list.slice(skip, skip + take);
      if (select) {
        return pageList.map((u) => {
          const res: any = {};
          for (const k of Object.keys(select)) {
            if (select[k]) res[k] = (u as any)[k];
          }
          return res;
        });
      }
      return pageList.map((u) => ({ ...u }));
    },
    create: async ({
      data,
    }: {
      data: Omit<IUser, "id" | "createdAt" | "updatedAt" | "deletedAt"> & {
        id?: string;
      };
    }) => {
      const newUser: IUser = {
        id:
          data.id ||
          `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone || null,
        role: data.role || "CUSTOMER",
        isVerified: data.isVerified ?? false,
        areaId: data.areaId || null,
        avatarUrl: data.avatarUrl || null,
        googleId: data.googleId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      store.users.push(newUser);
      return { ...newUser };
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<IUser>;
    }) => {
      const idx = store.users.findIndex((u) => u.id === where.id);
      if (idx === -1) throw new Error("User not found");
      store.users[idx] = {
        ...store.users[idx],
        ...data,
        updatedAt: new Date(),
      };
      return { ...store.users[idx] };
    },
    count: async ({ where }: { where?: Record<string, any> } = {}) => {
      return store.users.filter((u) => !u.deletedAt).length;
    },
  },

  distributionZone: {
    findMany: async ({ where, include, skip = 0, take = 50 }: any = {}) => {
      let list = store.distributionZones.filter((z) => !z.isDeleted);
      if (where?.region)
        list = list.filter((z) =>
          z.region.toLowerCase().includes(where.region.toLowerCase()),
        );
      if (where?.name && where.name.contains) {
        const q = where.name.contains.toLowerCase();
        list = list.filter(
          (z) =>
            z.name.toLowerCase().includes(q) ||
            z.code.toLowerCase().includes(q),
        );
      }
      const pageList = list.slice(skip, skip + take);
      if (include?.substations) {
        return pageList.map((z) => ({
          ...z,
          substations: store.substations
            .filter((s) => s.zoneId === z.id && !s.isDeleted)
            .map((s) => ({
              ...s,
              feeders: store.feeders.filter(
                (f) => f.substationId === s.id && !f.isDeleted,
              ),
            })),
        }));
      }
      return pageList;
    },
    findUnique: async ({
      where,
    }: {
      where: { id?: string; code?: string };
    }) => {
      return (
        store.distributionZones.find(
          (z) => !z.isDeleted && (z.id === where.id || z.code === where.code),
        ) || null
      );
    },
    create: async ({ data }: { data: any }) => {
      const zone: IDistributionZone = {
        id: `zone-${Date.now()}`,
        name: data.name,
        code: data.code,
        region: data.region,
        maxCapacityMW: data.maxCapacityMW || 500,
        currentLoadMW: data.currentLoadMW || 300,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.distributionZones.push(zone);
      return zone;
    },
    count: async () =>
      store.distributionZones.filter((z) => !z.isDeleted).length,
  },

  substation: {
    findMany: async ({ where }: any = {}) => {
      let list = store.substations.filter((s) => !s.isDeleted);
      if (where?.zoneId) list = list.filter((s) => s.zoneId === where.zoneId);
      return list;
    },
    create: async ({ data }: any) => {
      const sub: ISubstation = {
        id: `sub-${Date.now()}`,
        ...data,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.substations.push(sub);
      return sub;
    },
  },

  feeder: {
    findMany: async ({ where, include }: any = {}) => {
      let list = store.feeders.filter((f) => !f.isDeleted);
      if (where?.substationId)
        list = list.filter((f) => f.substationId === where.substationId);
      if (where?.status) list = list.filter((f) => f.status === where.status);
      if (include?.areas) {
        return list.map((f) => ({
          ...f,
          areas: store.areas.filter((a) => a.feederId === f.id && !a.isDeleted),
        }));
      }
      return list;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const f = store.feeders.find(
        (feeder) => feeder.id === where.id && !feeder.isDeleted,
      );
      if (!f) return null;
      return {
        ...f,
        substation: store.substations.find((s) => s.id === f.substationId),
        areas: store.areas.filter((a) => a.feederId === f.id && !a.isDeleted),
      };
    },
    create: async ({ data }: any) => {
      const feeder: IFeeder = {
        id: `fdr-${Date.now()}`,
        name: data.name,
        code: data.code,
        substationId: data.substationId,
        currentDemandMW: data.currentDemandMW || 10.0,
        maxLimitMW: data.maxLimitMW || 25.0,
        status: data.status || "ACTIVE",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.feeders.push(feeder);
      return feeder;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<IFeeder>;
    }) => {
      const idx = store.feeders.findIndex((f) => f.id === where.id);
      if (idx === -1) throw new Error("Feeder not found");
      store.feeders[idx] = {
        ...store.feeders[idx],
        ...data,
        updatedAt: new Date(),
      };
      return store.feeders[idx];
    },
    count: async () => store.feeders.filter((f) => !f.isDeleted).length,
  },

  area: {
    findMany: async ({ where }: any = {}) => {
      let list = store.areas.filter((a) => !a.isDeleted);
      if (where?.feederId)
        list = list.filter((a) => a.feederId === where.feederId);
      return list;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return store.areas.find((a) => a.id === where.id && !a.isDeleted) || null;
    },
  },

  loadSheddingSchedule: {
    findMany: async ({
      where,
      include,
      skip = 0,
      take = 50,
      orderBy,
    }: any = {}) => {
      let list = store.loadSheddingSchedules.filter((s) => !s.isDeleted);
      if (where?.feederId)
        list = list.filter((s) => s.feederId === where.feederId);
      if (where?.status) list = list.filter((s) => s.status === where.status);
      if (orderBy?.startTime === "asc") {
        list = [...list].sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime(),
        );
      } else {
        list = [...list].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      }
      const pageList = list.slice(skip, skip + take);
      if (include?.feeder) {
        return pageList.map((s) => ({
          ...s,
          feeder: store.feeders.find((f) => f.id === s.feederId),
        }));
      }
      return pageList;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      return (
        store.loadSheddingSchedules.find(
          (s) => s.id === where.id && !s.isDeleted,
        ) || null
      );
    },
    create: async ({ data }: any) => {
      const sched: ILoadSheddingSchedule = {
        id: `sched-${Date.now()}`,
        title: data.title,
        feederId: data.feederId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        targetDeficitMW: Number(data.targetDeficitMW) || 5.0,
        status: data.status || "SCHEDULED",
        recurringDays: data.recurringDays || [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.loadSheddingSchedules.push(sched);
      return sched;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<ILoadSheddingSchedule>;
    }) => {
      const idx = store.loadSheddingSchedules.findIndex(
        (s) => s.id === where.id,
      );
      if (idx === -1) throw new Error("Schedule not found");
      store.loadSheddingSchedules[idx] = {
        ...store.loadSheddingSchedules[idx],
        ...data,
        updatedAt: new Date(),
      };
      return store.loadSheddingSchedules[idx];
    },
    count: async ({ where }: any = {}) => {
      let list = store.loadSheddingSchedules.filter((s) => !s.isDeleted);
      if (where?.status) list = list.filter((s) => s.status === where.status);
      return list.length;
    },
  },

  outageReport: {
    findMany: async ({
      where,
      include,
      skip = 0,
      take = 50,
      orderBy,
    }: any = {}) => {
      let list = store.outageReports.filter((o) => !o.isDeleted);
      if (where?.status) list = list.filter((o) => o.status === where.status);
      if (where?.severity)
        list = list.filter((o) => o.severity === where.severity);
      if (where?.feederId)
        list = list.filter((o) => o.feederId === where.feederId);
      if (where?.assignedTechnicianId)
        list = list.filter(
          (o) => o.assignedTechnicianId === where.assignedTechnicianId,
        );
      if (where?.reportedById)
        list = list.filter((o) => o.reportedById === where.reportedById);
      if (where?.title && where.title.contains) {
        const q = where.title.contains.toLowerCase();
        list = list.filter(
          (o) =>
            o.title.toLowerCase().includes(q) ||
            o.ticketNumber.toLowerCase().includes(q) ||
            o.description.toLowerCase().includes(q),
        );
      }
      if (orderBy?.createdAt === "desc") {
        list = [...list].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      }
      const pageList = list.slice(skip, skip + take);
      if (include) {
        return pageList.map((o) => ({
          ...o,
          feeder: store.feeders.find((f) => f.id === o.feederId),
          area: store.areas.find((a) => a.id === o.areaId),
          reportedBy: store.users.find((u) => u.id === o.reportedById),
          assignedTechnician: o.assignedTechnicianId
            ? store.users.find((u) => u.id === o.assignedTechnicianId)
            : null,
          timeline: store.outageTimelines
            .filter((t) => t.outageId === o.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        }));
      }
      return pageList;
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { id?: string; ticketNumber?: string };
      include?: any;
    }) => {
      const o = store.outageReports.find(
        (report) =>
          !report.isDeleted &&
          (report.id === where.id ||
            report.ticketNumber === where.ticketNumber),
      );
      if (!o) return null;
      if (include) {
        return {
          ...o,
          feeder: store.feeders.find((f) => f.id === o.feederId),
          area: store.areas.find((a) => a.id === o.areaId),
          reportedBy: store.users.find((u) => u.id === o.reportedById),
          assignedTechnician: o.assignedTechnicianId
            ? store.users.find((u) => u.id === o.assignedTechnicianId)
            : null,
          timeline: store.outageTimelines
            .filter((t) => t.outageId === o.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        };
      }
      return { ...o };
    },
    create: async ({ data }: any) => {
      const count = store.outageReports.length + 1000;
      const report: IOutageReport = {
        id: `outage-${Date.now()}`,
        ticketNumber: `TKT-2026-${count}`,
        title: data.title,
        description: data.description,
        feederId: data.feederId,
        areaId: data.areaId,
        reportedById: data.reportedById,
        assignedTechnicianId: data.assignedTechnicianId || null,
        outageType: data.outageType || "UNPLANNED",
        severity: data.severity || "MEDIUM",
        status: "REPORTED",
        photoUrl: data.photoUrl || null,
        estimatedRestoration: data.estimatedRestoration
          ? new Date(data.estimatedRestoration)
          : null,
        restoredAt: null,
        resolutionNotes: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.outageReports.push(report);

      // Add timeline entry
      store.outageTimelines.push({
        id: `otl-${Date.now()}`,
        outageId: report.id,
        status: "REPORTED",
        notes: "Initial incident report logged",
        updatedById: report.reportedById,
        createdAt: new Date(),
      });

      return report;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<IOutageReport>;
    }) => {
      const idx = store.outageReports.findIndex((o) => o.id === where.id);
      if (idx === -1) throw new Error("Outage not found");
      store.outageReports[idx] = {
        ...store.outageReports[idx],
        ...data,
        updatedAt: new Date(),
      };
      return store.outageReports[idx];
    },
    count: async ({ where }: any = {}) => {
      let list = store.outageReports.filter((o) => !o.isDeleted);
      if (where?.status) list = list.filter((o) => o.status === where.status);
      return list.length;
    },
  },

  outageTimeline: {
    create: async ({ data }: any) => {
      const item: IOutageTimeline = {
        id: `otl-${Date.now()}`,
        outageId: data.outageId,
        status: data.status,
        notes: data.notes || null,
        updatedById: data.updatedById,
        createdAt: new Date(),
      };
      store.outageTimelines.push(item);
      return item;
    },
    findMany: async ({ where }: any = {}) => {
      return store.outageTimelines.filter((t) => t.outageId === where.outageId);
    },
  },

  payment: {
    create: async ({ data }: any) => {
      const payment: IPayment = {
        id: `pay-${Date.now()}`,
        transactionId:
          data.transactionId ||
          `TXN-GP-${Math.floor(10000 + Math.random() * 90000)}`,
        stripeSessionId: data.stripeSessionId || null,
        userId: data.userId,
        amount: Number(data.amount),
        currency: data.currency || "usd",
        purpose: data.purpose || "BILL_PAYMENT",
        status: data.status || "PENDING",
        metadata: data.metadata || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.payments.push(payment);
      return payment;
    },
    findMany: async ({ where, skip = 0, take = 50, orderBy }: any = {}) => {
      let list = [...store.payments];
      if (where?.userId) list = list.filter((p) => p.userId === where.userId);
      if (where?.status) list = list.filter((p) => p.status === where.status);
      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return list.slice(skip, skip + take);
    },
    findFirst: async ({ where }: any) => {
      return (
        store.payments.find((p) => {
          if (
            where?.stripeSessionId &&
            p.stripeSessionId === where.stripeSessionId
          )
            return true;
          if (where?.transactionId && p.transactionId === where.transactionId)
            return true;
          return false;
        }) || null
      );
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<IPayment>;
    }) => {
      const idx = store.payments.findIndex((p) => p.id === where.id);
      if (idx === -1) throw new Error("Payment record not found");
      store.payments[idx] = {
        ...store.payments[idx],
        ...data,
        updatedAt: new Date(),
      };
      return store.payments[idx];
    },
    count: async () => store.payments.length,
  },

  auditLog: {
    create: async ({ data }: any) => {
      const log: IAuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        createdAt: new Date(),
      };
      store.auditLogs.unshift(log);
      return log;
    },
    findMany: async ({ skip = 0, take = 50, orderBy }: any = {}) => {
      const list = [...store.auditLogs];
      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return list.slice(skip, skip + take);
    },
    count: async () => store.auditLogs.length,
  },

  // Transaction support wrapper
  $transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
    return await fn(prisma);
  },
};

// Use the PostgreSQL-backed Prisma client for application data persistence.
export const prisma = prismaClient;
