// backend/src/routes/tenant.routes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { tenantContext } from '../middleware/tenantContext';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '..', '..', 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// All routes require authentication and tenant context
router.use(auth, tenantContext);

// GET /tenant/info - Get current tenant information
router.get('/info', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
      include: {
        features: {
          include: { feature: true }
        },
        settings: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Convert settings array to object
    const settingsObj: Record<string, any> = {};
    tenant.settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      id: tenant.tenant_id,
      name: tenant.name,
      domain: tenant.domain,
      status: tenant.status,
      currencyCode: tenant.currency_code,
      createdAt: tenant.created_at,
      features: tenant.features.map((f: any) => ({
        key: f.feature.feature_key,
        enabled: f.is_enabled,
        description: f.feature.description
      })),
      settings: settingsObj
    });
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({ error: 'Failed to get tenant info' });
  }
});

// POST /tenant/upload - Upload a file (base64)
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { data, filename, type } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Extract base64 data (remove data:image/xxx;base64, prefix)
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename
    const ext = mimeType.split('/')[1] || 'png';
    const finalFilename = filename || `${tenantId}-${type || 'file'}-${Date.now()}.${ext}`;
    
    // Save file
    const filePath = join(uploadsDir, finalFilename);
    writeFileSync(filePath, buffer);

    // Return URL
    const fileUrl = `/uploads/${finalFilename}`;
    
    res.json({ url: fileUrl, filename: finalFilename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /tenant/settings - Get tenant settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const settings = await prisma.tenantSetting.findMany({
      where: { tenant_id: tenantId }
    });

    // Convert to object
    const settingsObj: Record<string, any> = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /tenant/settings - Update tenant settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const settings = req.body; // { key: value, ... }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.tenantSetting.upsert({
        where: {
          tenant_id_key: { tenant_id: tenantId, key }
        },
        update: { value: String(value) },
        create: {
          tenant_id: tenantId,
          key,
          value: String(value)
        }
      });
    }

    // Return updated settings
    const updatedSettings = await prisma.tenantSetting.findMany({
      where: { tenant_id: tenantId }
    });

    const settingsObj: Record<string, any> = {};
    updatedSettings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /tenant/stats - Get tenant statistics summary
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOrders,
      totalMenuItems,
      totalCategories,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue
    ] = await Promise.all([
      prisma.user.count({ where: { tenant_id: tenantId } }),
      prisma.order.count({ where: { tenant_id: tenantId } }),
      prisma.menuItem.count({ 
        where: { category: { menu: { tenant_id: tenantId } } } 
      }),
      prisma.menuCategory.count({ 
        where: { menu: { tenant_id: tenantId } } 
      }),
      prisma.order.count({ 
        where: { 
          tenant_id: tenantId,
          created_at: { gte: today }
        } 
      }),
      prisma.order.count({ 
        where: { 
          tenant_id: tenantId,
          order_status: { in: ['pending', 'confirmed', 'preparing'] }
        } 
      }),
      prisma.order.aggregate({
        where: { tenant_id: tenantId },
        _sum: { total: true }
      }),
      prisma.order.aggregate({
        where: { 
          tenant_id: tenantId,
          created_at: { gte: today }
        },
        _sum: { total: true }
      })
    ]);

    res.json({
      users: totalUsers,
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders
      },
      menu: {
        items: totalMenuItems,
        categories: totalCategories
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        today: todayRevenue._sum.total || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /tenant/customers - Get tenant customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = { tenant_id: tenantId };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          user_id: true,
          email: true,
          phone: true,
          status: true,
          created_at: true,
          last_active: true,
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: customers.map(c => ({
        id: c.user_id,
        email: c.email,
        phone: c.phone,
        status: c.status,
        createdAt: c.created_at,
        lastActive: c.last_active,
        orderCount: c._count.orders
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

// POST /tenant/customers - Create a new customer
router.post('/customers', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { name, email, phone, address, status } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { tenant_id: tenantId, email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    // Create user with a random password (they can reset it later)
    const bcrypt = require('bcrypt');
    const randomPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const customer = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: email.toLowerCase(),
        phone: phone || null,
        password_hash: passwordHash,
        status: status || 'active'
      }
    });

    // Assign CUSTOMER role if it exists
    const customerRole = await prisma.role.findFirst({
      where: { tenant_id: tenantId, name: 'CUSTOMER' }
    });

    if (customerRole) {
      await prisma.userRole.create({
        data: {
          tenant_id: tenantId,
          user_id: customer.user_id,
          role_id: customerRole.role_id
        }
      });
    }

    res.status(201).json({
      id: customer.user_id,
      name: name || email.split('@')[0],
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      createdAt: customer.created_at
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /tenant/customers/:id - Update a customer
router.put('/customers/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const customerId = req.params.id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { name, email, phone, status } = req.body;

    // Verify customer belongs to tenant
    const existing = await prisma.user.findFirst({
      where: { user_id: customerId, tenant_id: tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await prisma.user.update({
      where: { user_id: customerId },
      data: {
        email: email ? email.toLowerCase() : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        status: status || existing.status
      }
    });

    res.json({
      id: customer.user_id,
      name: name || customer.email.split('@')[0],
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      createdAt: customer.created_at
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /tenant/customers/:id - Delete a customer
router.delete('/customers/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const customerId = req.params.id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Verify customer belongs to tenant
    const existing = await prisma.user.findFirst({
      where: { user_id: customerId, tenant_id: tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete user roles first
    await prisma.userRole.deleteMany({
      where: { user_id: customerId }
    });

    // Delete the user
    await prisma.user.delete({
      where: { user_id: customerId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// GET /tenant/orders - Get tenant orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = { tenant_id: tenantId };
    if (status && status !== 'all') {
      where.order_status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, phone: true } },
          items: {
            include: {
              item: { select: { name: true } }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      data: orders.map((o: any) => ({
        id: o.order_id,
        customer: o.user?.email || 'Guest',
        phone: o.user?.phone,
        status: o.order_status,
        total: o.total,
        itemCount: o.items.length,
        items: o.items.map((i: any) => ({
          name: i.item?.name || i.name,
          quantity: i.qty,
          price: i.unit_price
        })),
        createdAt: o.created_at
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// POST /tenant/orders - Create a new order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { items, total_amount, delivery_address, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty', message: 'Please add items to your cart' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: { item_id: string; name: string; qty: number; unit_price: number; line_total: number }[] = [];

    for (const item of items) {
      // Get item details from database
      const menuItem = await prisma.menuItem.findFirst({
        where: { item_id: item.item_id, category: { menu: { tenant_id: tenantId } } }
      });

      if (!menuItem) {
        return res.status(400).json({ error: `Item ${item.item_id} not found` });
      }

      const unitPrice = parseFloat(menuItem.price.toString());
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        item_id: item.item_id,
        name: menuItem.name,
        qty: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal
      });
    }

    const tax = subtotal * 0.08; // 8% tax
    const deliveryFee = 2.99;
    const total = subtotal + tax + deliveryFee;

    // Create order
    const order = await prisma.order.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        order_status: 'pending',
        payment_status: 'pending',
        subtotal: subtotal,
        tax: tax,
        discount: 0,
        total: total,
        currency_code: 'USD',
        items: {
          create: orderItems.map(item => ({
            tenant_id: tenantId,
            item_id: item.item_id,
            name: item.name,
            qty: item.qty,
            unit_price: item.unit_price,
            line_total: item.line_total
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json({
      id: order.order_id,
      status: order.order_status,
      subtotal: parseFloat(order.subtotal.toString()),
      tax: parseFloat(order.tax.toString()),
      total: parseFloat(order.total.toString()),
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.qty,
        price: parseFloat(i.unit_price.toString())
      })),
      createdAt: order.created_at
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /tenant/menu - Get tenant menu with categories and items
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const menus = await prisma.menu.findMany({
      where: { tenant_id: tenantId },
      include: {
        categories: {
          include: {
            items: true
          },
          orderBy: { order_index: 'asc' }
        }
      }
    });

    res.json(menus.map((m: any) => ({
      id: m.menu_id,
      name: m.name,
      description: m.description,
      isActive: m.is_active,
      categories: m.categories.map((c: any) => ({
        id: c.category_id,
        name: c.name,
        sortOrder: c.order_index,
        items: c.items.map((i: any) => ({
          id: i.item_id,
          name: i.name,
          description: i.description,
          price: i.price,
          isAvailable: i.is_available
        }))
      }))
    })));
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

// GET /tenant/analytics - Get detailed analytics data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get date range (default last 7 days)
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders with items for analytics
    const orders = await prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        created_at: { gte: startDate }
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // Calculate revenue by day
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    const ordersByHour: Record<number, number> = {};
    const categoryStats: Record<string, { orders: number; revenue: number }> = {};

    orders.forEach(order => {
      // Revenue and orders by day
      const dayKey = order.created_at.toLocaleDateString('en-US', { weekday: 'short' });
      const total = parseFloat(order.total.toString());
      revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + total;
      ordersByDay[dayKey] = (ordersByDay[dayKey] || 0) + 1;

      // Orders by hour
      const hour = order.created_at.getHours();
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;

      // Category stats
      order.items.forEach((orderItem: any) => {
        if (orderItem.item?.category) {
          const catName = orderItem.item.category.name;
          if (!categoryStats[catName]) {
            categoryStats[catName] = { orders: 0, revenue: 0 };
          }
          categoryStats[catName].orders += orderItem.qty;
          categoryStats[catName].revenue += parseFloat(orderItem.unit_price.toString()) * orderItem.qty;
        }
      });
    });

    // Format revenue by day
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDayArray = dayOrder.map(day => ({
      label: day,
      value: Math.round(revenueByDay[day] || 0)
    }));

    // Format orders by hour (10am to 9pm)
    const ordersByHourArray = [];
    for (let h = 10; h <= 21; h++) {
      const label = h <= 12 ? `${h}am` : `${h - 12}pm`;
      ordersByHourArray.push({
        label: label.replace('12pm', '12pm').replace('0pm', '12pm'),
        value: ordersByHour[h] || 0
      });
    }

    // Format category stats
    const totalCategoryOrders = Object.values(categoryStats).reduce((sum, c) => sum + c.orders, 0);
    const ordersByCategoryArray = Object.entries(categoryStats)
      .map(([label, data]) => ({
        label,
        value: data.orders,
        revenue: Math.round(data.revenue),
        percentage: totalCategoryOrders > 0 ? Math.round((data.orders / totalCategoryOrders) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Get top products
    const itemStats: Record<string, { name: string; orders: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach((orderItem: any) => {
        if (orderItem.item) {
          const itemId = orderItem.item.item_id;
          if (!itemStats[itemId]) {
            itemStats[itemId] = { name: orderItem.item.name, orders: 0, revenue: 0 };
          }
          itemStats[itemId].orders += orderItem.qty;
          itemStats[itemId].revenue += parseFloat(orderItem.unit_price.toString()) * orderItem.qty;
        }
      });
    });

    const topProducts = Object.values(itemStats)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        orders: item.orders,
        revenue: Math.round(item.revenue)
      }));

    res.json({
      revenueByDay: revenueByDayArray,
      ordersByHour: ordersByHourArray,
      ordersByCategory: ordersByCategoryArray,
      topProducts,
      summary: {
        totalOrders: orders.length,
        totalRevenue: Math.round(orders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)),
        avgOrderValue: orders.length > 0 
          ? Math.round(orders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0) / orders.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// POST /tenant/menu - Create a new menu (or get existing)
router.post('/menu', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { name, description } = req.body;
    const menuName = name || 'Main Menu';

    // Check if menu already exists
    let menu = await prisma.menu.findFirst({
      where: { tenant_id: tenantId, name: menuName }
    });

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          tenant_id: tenantId,
          name: menuName,
          description: description || 'Default restaurant menu',
          is_active: true
        }
      });
    }

    res.status(201).json({
      menu_id: menu.menu_id,
      name: menu.name,
      description: menu.description,
      is_active: menu.is_active
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

// POST /tenant/categories - Create a new category
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { name, description, menu_id, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // If no menu_id provided, get or create default menu
    let menuId = menu_id;
    if (!menuId) {
      let menu = await prisma.menu.findFirst({
        where: { tenant_id: tenantId }
      });
      if (!menu) {
        menu = await prisma.menu.create({
          data: {
            tenant_id: tenantId,
            name: 'Main Menu',
            description: 'Default restaurant menu',
            is_active: true
          }
        });
      }
      menuId = menu.menu_id;
    }

    // Get max order_index for this menu
    const maxOrder = await prisma.menuCategory.aggregate({
      where: { menu_id: menuId },
      _max: { order_index: true }
    });
    const orderIndex = sort_order ?? ((maxOrder._max.order_index ?? -1) + 1);

    const category = await prisma.menuCategory.create({
      data: {
        tenant_id: tenantId,
        menu_id: menuId,
        name,
        order_index: orderIndex
      }
    });

    res.status(201).json({
      category_id: category.category_id,
      name: category.name,
      order_index: category.order_index,
      menu_id: category.menu_id
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /tenant/categories/:id - Update a category
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { id } = req.params;
    const { name, description, sort_order } = req.body;

    // Verify category belongs to tenant
    const existing = await prisma.menuCategory.findFirst({
      where: { 
        category_id: id,
        menu: { tenant_id: tenantId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = await prisma.menuCategory.update({
      where: { category_id: id },
      data: {
        name: name ?? existing.name,
        order_index: sort_order ?? existing.order_index
      }
    });

    res.json({
      category_id: category.category_id,
      name: category.name,
      order_index: category.order_index
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /tenant/categories/:id - Delete a category
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { id } = req.params;

    // Verify category belongs to tenant
    const existing = await prisma.menuCategory.findFirst({
      where: { 
        category_id: id,
        menu: { tenant_id: tenantId }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await prisma.menuCategory.delete({
      where: { category_id: id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// POST /tenant/items - Create a new menu item
router.post('/items', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { name, description, price, category_id, is_available, image_url } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ error: 'Name and category_id are required' });
    }

    // Verify category belongs to tenant
    const category = await prisma.menuCategory.findFirst({
      where: { 
        category_id,
        menu: { tenant_id: tenantId }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const item = await prisma.menuItem.create({
      data: {
        tenant_id: tenantId,
        category_id,
        name,
        description: description || null,
        price: price || 0,
        is_available: is_available ?? true
      }
    });

    res.status(201).json({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      price: item.price,
      is_available: item.is_available,
      category_id: item.category_id
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /tenant/items/:id - Update a menu item
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { id } = req.params;
    const { name, description, price, is_available, image_url, category_id } = req.body;

    // Verify item belongs to tenant
    const existing = await prisma.menuItem.findFirst({
      where: { 
        item_id: id,
        tenant_id: tenantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = await prisma.menuItem.update({
      where: { item_id: id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        price: price ?? existing.price,
        is_available: is_available ?? existing.is_available,
        category_id: category_id ?? existing.category_id
      }
    });

    res.json({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      price: item.price,
      is_available: item.is_available,
      category_id: item.category_id
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /tenant/items/:id - Delete a menu item
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const { id } = req.params;

    // Verify item belongs to tenant
    const existing = await prisma.menuItem.findFirst({
      where: { 
        item_id: id,
        tenant_id: tenantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.menuItem.delete({
      where: { item_id: id }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
