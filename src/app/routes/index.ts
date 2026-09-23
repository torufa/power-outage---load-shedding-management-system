import { Router } from 'express';
import { AdminRoutes } from '../modules/admin/admin.routes.js';
import { AuthRoutes } from '../modules/auth/auth.routes.js';
import { OutageRoutes } from '../modules/outage/outage.routes.js';
import { PaymentRoutes } from '../modules/payment/payment.routes.js';
import { ScheduleRoutes } from '../modules/schedule/schedule.routes.js';
import { UserRoutes } from '../modules/user/user.routes.js';
import { ZoneRoutes } from '../modules/zone/zone.routes.js';

const router = Router();

// Module Route Registrations
const moduleRoutes = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/zones', route: ZoneRoutes },
  { path: '/schedules', route: ScheduleRoutes },
  { path: '/outages', route: OutageRoutes },
  { path: '/payments', route: PaymentRoutes },
  { path: '/admin', route: AdminRoutes },
];

for (const module of moduleRoutes) {
  router.use(module.path, module.route);
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GridPulse Power Outage & Load Shedding Management API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    serialNumber: 3,
    system: 'Load Shedding & Power Outage Management System',
  });
});

export const AppRoutes = router;
