import { Router } from 'express';
import {
  getAllFlags,
  getFlagById,
  createFlag,
  updateFlag,
  toggleFlag,
  updateCleanupStatus,
  simulateUsage,
  deleteFlag,
  getDashboardStats,
  getAllAuditLogs,
  resetSeedsEndpoint
} from '../controllers/flagsController.js';

const router = Router();

// Metrics & Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/audit-logs', getAllAuditLogs);
router.post('/admin/reset-seeds', resetSeedsEndpoint);

// Flags CRUD & Actions
router.get('/flags', getAllFlags);
router.get('/flags/:id', getFlagById);
router.post('/flags', createFlag);
router.put('/flags/:id', updateFlag);
router.patch('/flags/:id/toggle', toggleFlag);
router.patch('/flags/:id/cleanup-status', updateCleanupStatus);
router.post('/flags/:id/simulate-usage', simulateUsage);
router.delete('/flags/:id', deleteFlag);

export default router;
