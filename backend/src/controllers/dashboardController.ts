// backend/src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { format, subDays } from 'date-fns';
import { Prisma } from '@prisma/client';

// Extend the Express Request type to include tenantId
declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: string;
  }
}

// Define the order with relations type
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: { select: { email: true } };
    items: true;
  };
}>;

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const [totalUsers, totalOrders, totalRevenue, activeUsers] = await Promise.all([
      prisma.user.count({ where: { tenant_id: tenantId } }),
      prisma.order.count({ where: { tenant_id: tenantId } }),
      prisma.order.aggregate({
        where: { tenant_id: tenantId },
        _sum: { total: true }
      }),
      prisma.user.count({ 
        where: { 
          tenant_id: tenantId,
          last_active: {
            gte: subDays(new Date(), 30)
          }
        } 
      })
    ]);

    res.json({
      totalUsers,
      totalOrders,
      activeUsers,
      totalRevenue: totalRevenue._sum.total || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Get recent orders with pagination
export const getRecentOrders = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { tenant_id: tenantId },
        include: {
          user: { select: { email: true } },
          items: true
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip
      }) as Promise<OrderWithRelations[]>,
      prisma.order.count({ where: { tenant_id: tenantId } })
    ]);

    res.json({
      data: orders.map((order: any) => ({
        id: order.order_id,
        orderNumber: order.order_id, // Using order_id as order number
        customer: order.user?.email || 'Guest',
        status: order.order_status,
        total: order.total,
        items: order.items.map((item: any) => item.name).filter(Boolean).join(', '),
        createdAt: order.created_at
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ message: 'Failed to fetch recent orders' });
  }
};

// Get order trends
export const getOrderTrends = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const { period = '30d' } = req.query;
    let days = 30; // Default to 30 days
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const today = new Date();
    const datePoints = Array.from({ length: days }, (_, i) => {
      const date = subDays(today, days - i - 1);
      return {
        date: format(date, 'MMM dd'),
        start: new Date(date.setHours(0, 0, 0, 0)),
        end: new Date(date.setHours(23, 59, 59, 999))
      };
    });

    const trends = await Promise.all(
      datePoints.map(async ({ date, start, end }) => {
        const orders = await prisma.order.findMany({
          where: {
            tenant_id: tenantId,
            created_at: {
              gte: start,
              lte: end
            }
          }
        });

        const revenue = orders.reduce((sum: number, order: any) => 
          sum + Number(order.total), 0);

        return {
          date,
          orders: orders.length,
          revenue
        };
      })
    );

    res.json(trends);
  } catch (error) {
    console.error('Error fetching order trends:', error);
    res.status(500).json({ message: 'Failed to fetch order trends' });
  }
};

// Get popular items
export const getPopularItems = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const limit = parseInt(req.query.limit as string) || 5;

    // Get order items grouped by menu item
    const popularItems = await prisma.$queryRaw`
      SELECT 
        mi.item_id as "menuItemId",
        mi.name as "itemName",
        c.name as "categoryName",
        COUNT(oi.order_item_id) as "orderCount",
        SUM(oi.quantity) as "totalQuantity"
      FROM "OrderItem" oi
      JOIN "MenuItem" mi ON oi.item_id = mi.item_id
      JOIN "Order" o ON oi.order_id = o.order_id
      LEFT JOIN "MenuCategory" c ON mi.category_id = c.category_id
      WHERE o.tenant_id = ${tenantId}
      GROUP BY mi.item_id, mi.name, c.name
      ORDER BY "totalQuantity" DESC
      LIMIT ${limit}
    `;

    res.json(popularItems);
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ message: 'Failed to fetch popular items' });
  }
};