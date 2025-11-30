// backend/src/routes/dashboardRoutes.ts
import { Router } from 'express';
import { 
  getDashboardStats, 
  getRecentOrders, 
  getOrderTrends,
  getPopularItems
} from '../controllers/dashboardController';
import { auth } from '../middleware/auth';
import { tenantContext } from '../middleware/tenantContext';

const router = Router();

// All routes require authentication and tenant context
router.use(auth, tenantContext);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Recent orders with pagination
router.get('/recent-orders', getRecentOrders);

// Order trends (supports period filter: 7d, 30d, 90d)
router.get('/order-trends', getOrderTrends);

// Popular items
router.get('/popular-items', getPopularItems);

export default router;